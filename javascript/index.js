import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
  import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

  const firebaseConfig = {
    apiKey: "AIzaSyCQntdUX66jx2X643aLPQ-5DdwkxVdwwfs",
    authDomain: "absensi-ae59d.firebaseapp.com",
    projectId: "absensi-ae59d",
    storageBucket: "absensi-ae59d.appspot.com",
    messagingSenderId: "616985671801",
    appId: "1:616985671801:web:b004f4d04f566b9eae3ca8"
  };

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const tableBody = document.querySelector('#absenTable tbody');

  function getStatus(waktu) {
    const jam = new Date(waktu);
    const batas = new Date(jam);
    batas.setHours(8, 0, 0);
    return jam > batas ? 'Terlambat' : 'Tepat Waktu';
  }

  function formatTanggal(waktuISO) {
    return new Date(waktuISO).toLocaleString('id-ID', {
      weekday: 'short', day: '2-digit', month: 'long',
      year: 'numeric', hour: '2-digit', minute: '2-digit'
    }).replace('.', ':');
  }

  async function loadData() {
    const q = query(collection(db, "absensi"), orderBy("waktu", "desc"));
    const snapshot = await getDocs(q);
    snapshot.forEach(doc => {
      const data = doc.data();
      const status = getStatus(data.waktu);

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${data.nama}</td>
        <td>${formatTanggal(data.waktu)}</td>
        <td class="${status === 'Terlambat' ? 'late' : 'on-time'}">${status}</td>
        <td class="alasan-badge">${data.alasan}</td>
      `;
      tableBody.appendChild(row);
    });
  }

  loadData();