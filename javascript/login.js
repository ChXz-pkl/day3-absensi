import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
    import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
    import { getFirestore, getDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

    const form = document.getElementById("loginForm");
    const errorBox = document.getElementById("error");

    form.onsubmit = async (e) => {
      e.preventDefault();
      const email = document.getElementById("username").value.trim();
      const password = document.getElementById("password").value.trim();
      errorBox.textContent = "";

      try {
        console.log("Attempting login:", email);
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("Login success!", user.uid);

        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists()) {
          const userData = docSnap.data();
          localStorage.setItem("isLoggedIn", "true");
          localStorage.setItem("currentUser", JSON.stringify({
            username: userData.username,
            role: userData.role
          }));
          window.location.href = "dashboard.html";
        } else {
          errorBox.textContent = "Data user tidak ditemukan di Firestore.";
        }
      } catch (error) {
        console.error("Login ERROR:", error.code, error.message);
        errorBox.textContent = `Gagal login: ${error.message}`;
      }
    };