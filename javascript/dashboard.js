import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, addDoc, deleteDoc, doc, collection, query, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const GOOGLE_SHEETS_URL = "https://script.google.com/macros/s/AKfycbyZc1_Pz9y-widlibkASScJlRXvNl7dMCA1vub5hg_92pEOWIOJ8by2F1j9xY7HNuW14g/exec"; // hasil deploy dari Step 1
const localSyncKey = "lastSyncDate";


const firebaseConfig = {
  apiKey: "AIzaSyCQntdUX66jx2X643aLPQ-5DdwkxVdwwfs",
  authDomain: "absensi-ae59d.firebaseapp.com",
  projectId: "absensi-ae59d",
  storageBucket: "absensi-ae59d.appspot.com",
  messagingSenderId: "616985671801",
  appId: "1:616985671801:web:b004f4d04f566b9eae3ca8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const tableBody = document.querySelector("#absenTable tbody");
const userInfo = document.getElementById("userInfo");
const namaInput = document.getElementById("nama");
const alasanInput = document.getElementById("alasan");
const form = document.getElementById("absenForm");
const mingguNav = document.getElementById("mingguNav");
const filterAlasan = document.getElementById("filterAlasan");
const filterStatus = document.getElementById("filterStatus");

let absensiData = [];
let selectedWeek = getWeekNumber(new Date());
let currentUser = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) return window.location.href = "login-page.html";
  currentUser = JSON.parse(localStorage.getItem("currentUser"));
  userInfo.textContent = `Login sebagai ${currentUser.username} (${currentUser.role})`;
  namaInput.value = currentUser.username;
  await loadData();
});
await syncIfNeeded();


form.onsubmit = async (e) => {
  e.preventDefault();
  const waktu = new Date().toISOString();
  await addDoc(collection(db, "absensi"), {
    nama: namaInput.value,
    waktu,
    alasan: alasanInput.value,
    oleh: namaInput.value
  });
  form.reset();
  namaInput.value = currentUser.username;
  await loadData();
};

async function loadData() {
  const q = query(collection(db, "absensi"), orderBy("waktu", "desc"));
  const snapshot = await getDocs(q);
  absensiData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  renderMingguButtons();
  renderTable();
}

function renderMingguButtons() {
  const mingguSet = new Set(absensiData.map(item => getWeekNumber(new Date(item.waktu))));
  mingguNav.innerHTML = '';
  [...mingguSet].sort().forEach(week => {
    const btn = document.createElement('button');
    btn.textContent = `Minggu ${week}`;
    btn.classList.toggle('active', week === selectedWeek);
    btn.onclick = () => {
      selectedWeek = week;
      renderTable();
      renderMingguButtons();
    };
    mingguNav.appendChild(btn);
  });
}

function renderTable() {
  const alasanFilter = filterAlasan.value;
  const statusFilter = filterStatus.value;
  tableBody.innerHTML = '';

  const filtered = absensiData
    .filter(item => getWeekNumber(new Date(item.waktu)) === selectedWeek)
    .filter(item => alasanFilter === 'all' || item.alasan === alasanFilter)
    .filter(item => {
      const status = getStatus(item.waktu);
      return statusFilter === 'all' || status === statusFilter;
    });

  document.getElementById("rekapMingguan").textContent = `Total absen minggu ini: ${filtered.length}`;

  filtered.forEach(item => {
    const status = getStatus(item.waktu);
    const canDelete = currentUser.role === "admin" || item.oleh === currentUser.username;
    const row = document.createElement("tr");
    row.innerHTML = `
          <td>${item.nama}</td>
          <td>${formatTanggal(item.waktu)}</td>
          <td class="${status === 'Terlambat' ? 'late' : 'on-time'}">${status}</td>
          <td class="alasan-badge">${item.alasan}</td>
          <td>${canDelete ? `<button class="delete-btn" onclick="hapus('${item.id}')">Hapus</button>` : ''}</td>
        `;
    tableBody.appendChild(row);
  });
}

window.hapus = async function (id) {
  if (!confirm("Yakin mau hapus absen ini?")) return;
  await deleteDoc(doc(db, "absensi", id));
  await loadData();
}

filterAlasan.addEventListener("change", renderTable);
filterStatus.addEventListener("change", renderTable);

function getWeekNumber(d) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function getStatus(waktuISO) {
  const jam = new Date(waktuISO);
  const batas = new Date(jam);
  batas.setHours(8, 0, 0);
  return jam > batas ? 'Terlambat' : 'Tepat Waktu';
}

function formatTanggal(waktuISO) {
  return new Date(waktuISO).toLocaleString("id-ID", {
    weekday: "short", day: "2-digit", month: "long",
    year: "numeric", hour: "2-digit", minute: "2-digit"
  });
}

async function syncIfNeeded() {
  const today = new Date().toISOString().split("T")[0];
  const lastSync = localStorage.getItem(localSyncKey);

  if (lastSync === today) return; // sudah disinkron hari ini

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const targetDate = yesterday.toISOString().split("T")[0];

  // Ambil data absensi dari Firestore
  const q = query(collection(db, "absensi"), orderBy("waktu", "asc"));
  const snapshot = await getDocs(q);

  const dataToExport = snapshot.docs
    .map(doc => doc.data())
    .filter(d => d.waktu.startsWith(targetDate));

  if (dataToExport.length > 0) {
    try {
      const response = await fetch(GOOGLE_SHEETS_URL, {
        method: "POST",
        body: JSON.stringify(dataToExport),
        headers: { "Content-Type": "application/json" }
      });

      console.log("Backup sukses:", await response.text());

      // Hapus data yang sudah dikirim
      snapshot.docs.forEach(async docSnap => {
        const item = docSnap.data();
        if (item.waktu.startsWith(targetDate)) {
          await deleteDoc(doc(db, "absensi", docSnap.id));
        }
      });

      localStorage.setItem(localSyncKey, today);
    } catch (err) {
      console.error("Gagal kirim ke Google Sheets:", err);
    }
  } else {
    console.log("Tidak ada data absen untuk", targetDate);
    localStorage.setItem(localSyncKey, today);
  }
}


window.logout = () => {
  localStorage.clear();
  signOut(auth).then(() => location.href = "index.html");
};
