#!/data/data/com.termux/files/usr/bin/bash
# ── Dayynime Setup Script untuk Termux ────────────────────────────────────────

echo ""
echo "🎌 Dayynime - Setup Termux"
echo "══════════════════════════"
echo ""

# Update & install Python
echo "📦 Install dependencies Termux..."
pkg update -y && pkg install -y python python-pip

# Install Python packages
echo ""
echo "🐍 Install Python packages..."
pip install flask requests

# Jalankan
echo ""
echo "🚀 Menjalankan Dayynime..."
echo ""
python app.py
