from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import math

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT & Password Config
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# ============ MODELS ============

class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: str = "employee"  # employee or admin

class UserCreate(UserBase):
    password: str

class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    face_descriptors: List[List[float]] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class FaceRegister(BaseModel):
    descriptors: List[List[float]]

class OfficeLocation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    latitude: float
    longitude: float
    radius: float = 100.0  # meters
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OfficeLocationCreate(BaseModel):
    name: str
    latitude: float
    longitude: float
    radius: float = 100.0

class AttendanceCheckIn(BaseModel):
    latitude: float
    longitude: float
    face_descriptor: List[float]

class AttendanceCheckOut(BaseModel):
    latitude: float
    longitude: float

class Attendance(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_name: str
    user_email: str
    date: str
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    check_in_location: Optional[dict] = None
    check_out_location: Optional[dict] = None
    face_match_score: Optional[float] = None
    status: str = "checked_in"  # checked_in, checked_out
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ============ HELPER FUNCTIONS ============

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if user is None:
        raise credentials_exception
    
    if isinstance(user.get('created_at'), str):
        user['created_at'] = datetime.fromisoformat(user['created_at'])
    
    return User(**user)

def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two points using Haversine formula (in meters)"""
    R = 6371000  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    
    a = math.sin(delta_phi/2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c

def compare_face_descriptors(descriptor1, descriptor2):
    """Calculate Euclidean distance between two face descriptors"""
    if len(descriptor1) != len(descriptor2):
        return float('inf')
    
    distance = sum((a - b) ** 2 for a, b in zip(descriptor1, descriptor2)) ** 0.5
    # Convert distance to similarity score (0-100)
    # Lower distance = higher similarity
    similarity = max(0, 100 - (distance * 10))
    return similarity

# ============ AUTH ROUTES ============

@api_router.post("/auth/register", response_model=User)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_dict = user_data.model_dump(exclude={"password"})
    user = User(**user_dict)
    hashed_password = get_password_hash(user_data.password)
    
    doc = user.model_dump()
    doc['password'] = hashed_password
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.users.insert_one(doc)
    return user

@api_router.post("/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    user_doc = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not verify_password(user_data.password, user_doc['password']):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create token
    access_token = create_access_token(data={"sub": user_doc['id']})
    
    # Convert datetime
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    user = User(**user_doc)
    
    return Token(access_token=access_token, token_type="bearer", user=user)

@api_router.get("/users/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@api_router.post("/auth/register-face")
async def register_face(face_data: FaceRegister, current_user: User = Depends(get_current_user)):
    # Update user's face descriptors
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {"face_descriptors": face_data.descriptors}}
    )
    return {"message": "Face registered successfully", "descriptors_count": len(face_data.descriptors)}

# ============ OFFICE ROUTES ============

@api_router.post("/office/location", response_model=OfficeLocation)
async def create_office_location(location_data: OfficeLocationCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can set office location")
    
    # Delete existing location
    await db.offices.delete_many({})
    
    location = OfficeLocation(**location_data.model_dump())
    doc = location.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.offices.insert_one(doc)
    return location

@api_router.get("/office/location", response_model=OfficeLocation)
async def get_office_location():
    office_doc = await db.offices.find_one({}, {"_id": 0})
    if not office_doc:
        raise HTTPException(status_code=404, detail="Office location not set")
    
    if isinstance(office_doc.get('created_at'), str):
        office_doc['created_at'] = datetime.fromisoformat(office_doc['created_at'])
    
    return OfficeLocation(**office_doc)

# ============ ATTENDANCE ROUTES ============

@api_router.post("/attendance/check-in", response_model=Attendance)
async def check_in(data: AttendanceCheckIn, current_user: User = Depends(get_current_user)):
    # Check if already checked in today
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    existing = await db.attendance.find_one({"user_id": current_user.id, "date": today})
    if existing:
        raise HTTPException(status_code=400, detail="Already checked in today")
    
    # Validate face
    if not current_user.face_descriptors:
        raise HTTPException(status_code=400, detail="Please register your face first")
    
    # Compare with stored face descriptors
    max_similarity = 0
    for stored_descriptor in current_user.face_descriptors:
        similarity = compare_face_descriptors(data.face_descriptor, stored_descriptor)
        max_similarity = max(max_similarity, similarity)
    
    if max_similarity < 70:  # Threshold 70%
        raise HTTPException(status_code=400, detail=f"Face verification failed. Match: {max_similarity:.1f}%")
    
    # Validate location
    office = await db.offices.find_one({}, {"_id": 0})
    if office:
        distance = calculate_distance(
            data.latitude, data.longitude,
            office['latitude'], office['longitude']
        )
        if distance > office['radius']:
            raise HTTPException(
                status_code=400,
                detail=f"You are {distance:.0f}m away. Must be within {office['radius']:.0f}m of office"
            )
    
    # Create attendance
    attendance = Attendance(
        user_id=current_user.id,
        user_name=current_user.name,
        user_email=current_user.email,
        date=today,
        check_in_time=datetime.now(timezone.utc),
        check_in_location={"latitude": data.latitude, "longitude": data.longitude},
        face_match_score=max_similarity,
        status="checked_in"
    )
    
    doc = attendance.model_dump()
    doc['check_in_time'] = doc['check_in_time'].isoformat()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.attendance.insert_one(doc)
    return attendance

@api_router.post("/attendance/check-out", response_model=Attendance)
async def check_out(data: AttendanceCheckOut, current_user: User = Depends(get_current_user)):
    # Find today's attendance
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    attendance_doc = await db.attendance.find_one(
        {"user_id": current_user.id, "date": today, "status": "checked_in"},
        {"_id": 0}
    )
    
    if not attendance_doc:
        raise HTTPException(status_code=400, detail="No check-in found for today")
    
    # Update attendance
    check_out_time = datetime.now(timezone.utc)
    await db.attendance.update_one(
        {"id": attendance_doc['id']},
        {
            "$set": {
                "check_out_time": check_out_time.isoformat(),
                "check_out_location": {"latitude": data.latitude, "longitude": data.longitude},
                "status": "checked_out"
            }
        }
    )
    
    # Get updated doc
    updated_doc = await db.attendance.find_one({"id": attendance_doc['id']}, {"_id": 0})
    
    # Convert datetime strings
    if isinstance(updated_doc.get('check_in_time'), str):
        updated_doc['check_in_time'] = datetime.fromisoformat(updated_doc['check_in_time'])
    if isinstance(updated_doc.get('check_out_time'), str):
        updated_doc['check_out_time'] = datetime.fromisoformat(updated_doc['check_out_time'])
    if isinstance(updated_doc.get('created_at'), str):
        updated_doc['created_at'] = datetime.fromisoformat(updated_doc['created_at'])
    
    return Attendance(**updated_doc)

@api_router.get("/attendance/my-history", response_model=List[Attendance])
async def get_my_history(current_user: User = Depends(get_current_user)):
    attendance_list = await db.attendance.find(
        {"user_id": current_user.id},
        {"_id": 0}
    ).sort("date", -1).to_list(100)
    
    # Convert datetime strings
    for att in attendance_list:
        if isinstance(att.get('check_in_time'), str):
            att['check_in_time'] = datetime.fromisoformat(att['check_in_time'])
        if isinstance(att.get('check_out_time'), str):
            att['check_out_time'] = datetime.fromisoformat(att['check_out_time'])
        if isinstance(att.get('created_at'), str):
            att['created_at'] = datetime.fromisoformat(att['created_at'])
    
    return [Attendance(**att) for att in attendance_list]

@api_router.get("/attendance/all", response_model=List[Attendance])
async def get_all_attendance(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can view all attendance")
    
    attendance_list = await db.attendance.find(
        {},
        {"_id": 0}
    ).sort("date", -1).to_list(1000)
    
    # Convert datetime strings
    for att in attendance_list:
        if isinstance(att.get('check_in_time'), str):
            att['check_in_time'] = datetime.fromisoformat(att['check_in_time'])
        if isinstance(att.get('check_out_time'), str):
            att['check_out_time'] = datetime.fromisoformat(att['check_out_time'])
        if isinstance(att.get('created_at'), str):
            att['created_at'] = datetime.fromisoformat(att['created_at'])
    
    return [Attendance(**att) for att in attendance_list]

@api_router.get("/attendance/today-status")
async def get_today_status(current_user: User = Depends(get_current_user)):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    attendance = await db.attendance.find_one(
        {"user_id": current_user.id, "date": today},
        {"_id": 0}
    )
    
    if not attendance:
        return {"status": "not_checked_in", "attendance": None}
    
    # Convert datetime strings
    if isinstance(attendance.get('check_in_time'), str):
        attendance['check_in_time'] = datetime.fromisoformat(attendance['check_in_time'])
    if isinstance(attendance.get('check_out_time'), str):
        attendance['check_out_time'] = datetime.fromisoformat(attendance['check_out_time'])
    if isinstance(attendance.get('created_at'), str):
        attendance['created_at'] = datetime.fromisoformat(attendance['created_at'])
    
    return {"status": attendance['status'], "attendance": Attendance(**attendance)}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
