import { auth } from "./firebase-config.js";
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

export function loginWithGoogle() {
  signInWithPopup(auth, provider).catch(error => {
    console.error('Error en login:', error);
  });
}

export function logout() {
  signOut(auth).catch(error => {
    console.error('Error al cerrar sesión:', error);
  });
}

onAuthStateChanged(auth, user => {
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const userInfo = document.getElementById('user-info');

  if (user) {
    userInfo.textContent = `Bienvenido, ${user.displayName}`;
    userInfo.style.display = 'block';
    loginBtn.style.display = 'none';
    logoutBtn.style.display = 'inline-block';
  } else {
    userInfo.style.display = 'none';
    loginBtn.style.display = 'inline-block';
    logoutBtn.style.display = 'none';
  }
});

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('login-btn').addEventListener('click', loginWithGoogle);
  document.getElementById('logout-btn').addEventListener('click', logout);
});
