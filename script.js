const startCameraBtn = document.getElementById('startCameraBtn');
const captureBtn = document.getElementById('captureBtn');
const submitBtn = document.getElementById('submitBtn');
const statusTag = document.getElementById('statusTag');
const video = document.getElementById('cameraPreview');
const canvas = document.getElementById('captureCanvas');
const photoPlaceholder = document.getElementById('photoPlaceholder');
const toast = document.getElementById('toast');
const studentNameInput = document.getElementById('studentName');

let stream = null;
let capturedPhoto = null;

const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

function updateStatus(text) {
  statusTag.textContent = text;
}

async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
    video.srcObject = stream;
    video.hidden = false;
    photoPlaceholder.hidden = true;
    captureBtn.disabled = false;
    submitBtn.disabled = true;
    updateStatus('Kamera aktif');
  } catch (error) {
    updateStatus('Kamera tidak tersedia');
    showToast('Tidak dapat mengakses kamera. Periksa izin browser.');
  }
}

function capturePhoto() {
  if (!stream) return;

  const videoTrack = stream.getVideoTracks()[0];
  const settings = videoTrack.getSettings();
  const width = settings.width || video.videoWidth || 640;
  const height = settings.height || video.videoHeight || 480;

  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  context.drawImage(video, 0, 0, width, height);
  capturedPhoto = canvas.toDataURL('image/jpeg', 0.9);

  const previewImage = new Image();
  previewImage.src = capturedPhoto;
  previewImage.alt = 'Foto wajah hasil ambil';
  previewImage.onload = () => {
    photoPlaceholder.innerHTML = '';
    photoPlaceholder.appendChild(previewImage);
    photoPlaceholder.hidden = false;
    video.hidden = true;
    updateStatus('Foto diambil');
    submitBtn.disabled = false;
  };
}

async function submitAttendance() {
  const nama = studentNameInput.value.trim();
  if (!nama) {
    showToast('Masukkan nama terlebih dahulu.');
    return;
  }
  if (!capturedPhoto) {
    showToast('Ambil foto wajah terlebih dahulu.');
    return;
  }

  const now = new Date();
  const payload = {
    nama,
    tanggal: now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    jam: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    foto: capturedPhoto,
  };

  try {
    await sendToGoogleSheet(payload);
    showToast('Absensi berhasil');
    submitBtn.disabled = true;
    captureBtn.disabled = false;
  } catch (error) {
    console.error(error);
    showToast('Gagal menyimpan absensi.');
  }
}

async function sendToGoogleSheet(payload) {
  if (GOOGLE_SHEET_URL.includes('YOUR_SCRIPT_ID')) {
    console.warn('Google Sheet URL belum dikonfigurasi. Data tidak dikirim.');
    return Promise.resolve();
  }

  const response = await fetch(GOOGLE_SHEET_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Gagal mengirim data ke Google Sheets');
  }

  return response.json();
}

startCameraBtn.addEventListener('click', startCamera);
captureBtn.addEventListener('click', capturePhoto);
submitBtn.addEventListener('click', submitAttendance);

studentNameInput.addEventListener('input', () => {
  if (!studentNameInput.value.trim()) {
    submitBtn.disabled = true;
  }
});
