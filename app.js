// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyC-ymTWMvzVotmhsk9CQ6jnT-KjOXn1QLc",
  authDomain: "techloop-dd0f9.firebaseapp.com",
  projectId: "techloop-dd0f9",
  storageBucket: "techloop-dd0f9.firebasestorage.app",
  messagingSenderId: "443466508957",
  appId: "1:443466508957:web:84d62a14013e2120878274",
  measurementId: "G-1K1J9W0L2H"
};

// Initialize Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// DOM Elements
const userSection = document.getElementById('user-section');
const productsGrid = document.getElementById('products-grid');
const searchInput = document.getElementById('search-input');
const categoryPills = document.getElementById('category-pills');
const cityFilter = document.getElementById('city-filter');

// State
let cartCount = 0;
let allProducts = [];
let selectedCategory = 'all';
let selectedCity = 'all';

// Mock Product Data
const products = [
  {
    id: 1,
    name: "iPhone 13 Pro Max",
    price: 850.00,
    image: "https://images.unsplash.com/photo-1632661674596-df8b762a8bd6?w=400&h=300&fit=crop",
    description: "128GB, Batería al 95%, excelente estado. Incluye cargador original.",
    category: "smartphone",
    city: "Bogotá",
    condition: "Reacondicionado",
    badge: "new"
  },
  {
    id: 2,
    name: "MacBook Air M1",
    price: 1200.00,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop",
    description: "8GB RAM, 256GB SSD. Pantalla Retina perfecta, batería 90% salud.",
    category: "laptop",
    city: "Medellín",
    condition: "Reacondicionado",
    badge: "new"
  },
  {
    id: 3,
    name: "Monitor Samsung Odyssey G5",
    price: 349.99,
    image: "https://images.unsplash.com/photo-1586210574645-cf4a87fd1e52?w=400&h=300&fit=crop",
    description: "27 pulgadas, curvo, 144Hz, 1ms respuesta. Como nuevo.",
    category: "accessory",
    city: "Cali",
    condition: "Nuevo",
    badge: "new"
  },
  {
    id: 4,
    name: "Cargador Rápido GaN 65W",
    price: 39.99,
    image: "https://images.unsplash.com/photo-1585735635353-6f193308d1e7?w=400&h=300&fit=crop",
    description: "Compacto, compatible PD/QC, tecnología GaN. Perfecto para laptop y móvil.",
    category: "accessory",
    city: "Bogotá",
    condition: "Nuevo",
    badge: "new"
  },
  {
    id: 5,
    name: "Mouse Gamer Logitech G502",
    price: 59.99,
    image: "https://images.unsplash.com/photo-1527814050087-3793815479db?w=400&h=300&fit=crop",
    description: "Sensor HERO 25K, 11 botones programables, iluminación RGB.",
    category: "accessory",
    city: "Bucaramanga",
    condition: "Reacondicionado",
    badge: "refurbished"
  },
  {
    id: 6,
    name: "Samsung Galaxy S22 Ultra",
    price: 750.00,
    image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&h=300&fit=crop",
    description: "256GB, S-Pen incluido, cámara 108MP. Batería al 92%.",
    category: "smartphone",
    city: "Medellín",
    condition: "Reacondicionado",
    badge: "refurbished"
  },
  {
    id: 7,
    name: "AirPods Pro 2da Gen",
    price: 180.00,
    image: "https://images.unsplash.com/photo-1600294037681-c22444573077?w=400&h=300&fit=crop",
    description: "Cancelación activa de ruido, chip H2, estuche MagSafe.",
    category: "audio",
    city: "Cali",
    condition: "Nuevo",
    badge: "new"
  },
  {
    id: 8,
    name: "Dell XPS 13",
    price: 950.00,
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop",
    description: "i7 11va gen, 16GB RAM, 512GB SSD. Ultrabook en perfecto estado.",
    category: "laptop",
    city: "Bogotá",
    condition: "Reacondicionado",
    badge: "refurbished"
  }
];

allProducts = [...products];

/* ------------------------- */
/* Firebase Auth            */
/* ------------------------- */
const renderLoggedInUser = (user) => {
  const initials = user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U';
  const photoURL = user.photoURL ? `<img src="${user.photoURL}" alt="Perfil">` : initials;
  
  userSection.innerHTML = `
    <div class="user-avatar">${photoURL}</div>
    <span class="user-name">${user.displayName || 'Usuario'}</span>
    <button id="logout-btn" class="logout-btn">Cerrar Sesión</button>
  `;
  document.getElementById('logout-btn').addEventListener('click', handleLogout);
};

const renderLoggedOutUser = () => {
  userSection.innerHTML = `<button id="login-btn" class="login-btn">Iniciar sesión con Google</button>`;
  document.getElementById('login-btn').addEventListener('click', handleLogin);
};

const handleLogin = () => {
  signInWithPopup(auth, googleProvider).catch(error => console.error('Error login:', error));
};

const handleLogout = () => {
  signOut(auth).catch(error => console.error('Error logout:', error));
};

onAuthStateChanged(auth, (user) => {
  user ? renderLoggedInUser(user) : renderLoggedOutUser();
});

/* ------------------------- */
/* Product Rendering        */
/* ------------------------- */
const getBadgeHTML = (badge) => {
  if (badge === 'new') return '<span class="badge badge-new">Nuevo</span>';
  if (badge === 'refurbished') return '<span class="badge badge-refurbished">Reacondicionado</span>';
  return '';
};

const renderProducts = (productsArray) => {
  if (productsArray.length === 0) {
    productsGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 4rem 2rem; background-color: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 16px;">
        <span style="font-size: 4rem; display: block; margin-bottom: 1rem;">📦</span>
        <h3 style="font-size: 1.5rem; margin-bottom: .5rem; color: var(--text-primary);">No se encontraron productos</h3>
        <p style="color: var(--text-secondary);">Intenta ajustar los filtros de búsqueda</p>
      </div>
    `;
    return;
  }

  productsGrid.innerHTML = '';
  productsArray.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="card-image">
        <img src="${product.image}" alt="${product.name}" loading="lazy">
        <div class="card-badges">
          ${getBadgeHTML(product.badge)}
          <span class="badge badge-refurbished">${product.condition}</span>
        </div>
      </div>
      <div class="card-content">
        <h3 class="card-title">${product.name}</h3>
        <p class="card-description">${product.description}</p>
        <div class="card-footer">
          <span class="card-price">$${product.price.toFixed(2)}</span>
          <span class="card-city">📍 ${product.city}</span>
        </div>
        <button class="add-to-cart-btn" data-id="${product.id}">Añadir al carrito</button>
      </div>
    `;
    productsGrid.appendChild(card);
  });

  // Add to cart event listeners
  document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      cartCount++;
      e.target.textContent = 'Añadido ✓';
      e.target.classList.add('added');
      setTimeout(() => {
        e.target.textContent = 'Añadir al carrito';
        e.target.classList.remove('added');
      }, 1000);
    });
  });
};

/* ------------------------- */
/* Filtering & Search       */
/* ------------------------- */
const filterProducts = () => {
  const searchTerm = searchInput.value.toLowerCase();
  let filtered = allProducts;

  // Search filter
  if (searchTerm) {
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(searchTerm) || 
      p.description.toLowerCase().includes(searchTerm)
    );
  }

  // Category filter
  if (selectedCategory !== 'all') {
    filtered = filtered.filter(p => p.category === selectedCategory);
  }

  // City filter
  if (selectedCity !== 'all') {
    filtered = filtered.filter(p => p.city === selectedCity);
  }

  renderProducts(filtered);
};

// Search input
searchInput.addEventListener('input', filterProducts);

// Category pills
categoryPills.addEventListener('click', (e) => {
  if (e.target.classList.contains('pill')) {
    document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    e.target.classList.add('active');
    selectedCategory = e.target.dataset.category;
    filterProducts();
  }
});

// City filter
cityFilter.addEventListener('change', (e) => {
  selectedCity = e.target.value;
  filterProducts();
});

// Initial render
renderProducts(allProducts);
