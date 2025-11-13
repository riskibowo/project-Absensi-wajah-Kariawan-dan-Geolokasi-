
# Proyek Absensi Wajah (FaceAttend)

Proyek ini adalah aplikasi *full-stack* untuk sistem absensi (check-in/check-out) menggunakan verifikasi lokasi dan pengenalan wajah (*face recognition*).

Aplikasi ini dibagi menjadi dua komponen utama:
* **Backend**: Dibangun dengan **Python (FastAPI)**, terhubung ke database **MongoDB**.
* **Frontend**: Dibangun dengan **React.js** (menggunakan `craco`) dan `face-api.js` untuk pemrosesan wajah di sisi klien.

---

## 📋 Prasyarat Sistem

Sebelum Anda memulai, pastikan perangkat Anda telah terinstal perangkat lunak berikut:

* **Node.js**: (v18.x atau lebih tinggi) - Ini sudah termasuk `npm`.
* **Python**: (v3.10 atau lebih tinggi) - Ini sudah termasuk `pip`.
* **MongoDB**: Pastikan layanan MongoDB Anda berjalan di `mongodb://localhost:27017`.
* **Git**: Untuk kloning repositori.

---

## 🚀 Instalasi dan Cara Menjalankan

Proyek ini harus dijalankan di **dua terminal** terpisah (satu untuk Backend, satu untuk Frontend).

### 1. Klon Repositori

```bash
git clone [https://github.com/username/nama-repositori-anda.git](https://github.com/username/nama-repositori-anda.git)
cd nama-repositori-anda
````

-----

### 2\. Pengaturan Backend (Python)

1.  Buka terminal pertama Anda.
2.  Buat dan aktifkan *virtual environment* (disarankan):
    ```bash
    # (Di direktori utama proyek)
    python -m venv venv

    # Aktivasi di Windows (PowerShell)
    .\venv\Scripts\Activate.ps1

    # Aktivasi di macOS/Linux
    source venv/bin/activate
    ```
3.  Navigasi ke folder `backend`:
    ```bash
    cd backend
    ```
4.  Instal semua dependensi Python:
    ```bash
    pip install -r requirements.txt
    ```
5.  Buat *file* `.env` di dalam folder `backend`. Salin konten di bawah ini dan sesuaikan (terutama `SECRET_KEY`):
    ```ini
    MONGO_URL=mongodb://localhost:27017/
    DB_NAME=absensi_db
    SECRET_KEY=ganti-dengan-kunci-rahasia-anda-yang-panjang-dan-aman
    CORS_ORIGINS=http://localhost:3000
    ```
6.  **Jalankan server backend**:
    ```bash
    uvicorn server:app --reload
    ```
    Server Anda sekarang berjalan di `http://127.0.0.1:8000`. Biarkan terminal ini tetap terbuka.

-----

### 3\. Pengaturan Frontend (React)

1.  Buka **terminal baru** (biarkan terminal backend tetap berjalan).

2.  Navigasi ke folder `frontend`:

    ```bash
    # (Dari direktori utama proyek)
    cd frontend
    ```

3.  Instal dependensi Node.js.

    > **PENTING:** Proyek ini memiliki konflik dependensi warisan. Gunakan *flag* `--legacy-peer-deps` untuk mengatasinya.

    ```bash
    npm install --legacy-peer-deps
    ```

4.  Buat *file* `.env` di dalam folder `frontend`. Variabel ini wajib ada agar *frontend* tahu alamat API *backend*:

    ```ini
    REACT_APP_API_URL=http://localhost:8000/api
    GENERATE_SOURCEMAP=false
    ```

    *(`GENERATE_SOURCEMAP=false` ditambahkan untuk menyembunyikan *warning* yang tidak relevan dari `face-api.js`)*

5.  **Jalankan server frontend**:

    ```bash
    npm start
    ```

    *Browser* Anda akan otomatis terbuka di `http://localhost:3000`.

-----

## 📁 Struktur Folder Penting

```
.
├── backend/
│ ├── .env            # (Anda buat) File konfigurasi backend
│ ├── requirements.txt # Dependensi Python
│ └── server.py       # Logika API (FastAPI)
└── frontend/
  ├── .env            # (Anda buat) File konfigurasi frontend
  ├── package.json    # Dependensi JavaScript (React)
  ├── craco.config.js # Konfigurasi Craco (untuk `fs` bug)
  ├── public/
  │ └── models/       # Model face-api.js yang sudah dilatih
  └── src/
    ├── App.js        # Logika routing utama
    ├── components/   # Komponen UI
    └── pages/
      ├── Login.js    # Logika login/register
      ├── Dashboard.js # Halaman check-in/check-out
      ├── FaceRegistration.js # Logika pendaftaran wajah
      └── AdminDashboard.js # Halaman admin
```

```
```
