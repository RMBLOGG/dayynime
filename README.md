# 🎌 Dayynime

Website streaming anime subtitle Indonesia — dioptimasi untuk Termux.

## 🚀 Cara Install di Termux

### Otomatis:
```bash
bash setup_termux.sh
```

### Manual:
```bash
pkg update && pkg install python python-pip
pip install flask requests
python app.py
```

Buka browser: `http://localhost:5000`

## ⚙️ Konfigurasi opsional

```bash
export SECRET_KEY=ganti-ini
export PORT=5000
export FLASK_DEBUG=0
```

## 🔄 Perubahan dari versi original

| Fitur | Original | Termux |
|---|---|---|
| Cache | Upstash Redis (cloud) | In-memory (lokal) |
| Dependencies | flask, requests, upstash-redis | flask, requests saja |
| ENV vars wajib | UPSTASH_REDIS_* | Tidak ada |
| Supabase | Wajib | Opsional (tidak crash) |
