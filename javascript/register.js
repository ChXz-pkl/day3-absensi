    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
    import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
    import { getFirestore, setDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

    const daftarBtn = document.getElementById("daftarBtn");
    const errorMsg = document.getElementById("error");

    daftarBtn.onclick = async () => {
      const nama = document.getElementById("nama").value.trim();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();
      const role = document.getElementById("role").value;

      console.log("Mulai proses daftar...");
      console.log({ nama, email, password, role });

      errorMsg.textContent = "";

      if (!nama || !email || !password) {
        errorMsg.textContent = "Semua field wajib diisi.";
        return;
      }

      if (!email.includes("@") || !email.includes(".")) {
        errorMsg.textContent = "Email tidak valid.";
        return;
      }

      if (password.length < 6) {
        errorMsg.textContent = "Password minimal 6 karakter.";
        return;
      }

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await setDoc(doc(db, "users", user.uid), {
          username: nama,
          role: role
        });

        alert("Registrasi berhasil!");
        window.location.href = "login-page.html";
      } catch (error) {
        console.error("Registrasi GAGAL:", error.code, error.message);
        errorMsg.textContent = `Gagal daftar: ${error.message}`;
      }
    };