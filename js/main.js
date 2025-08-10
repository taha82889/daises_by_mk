document.addEventListener('DOMContentLoaded', () => {
  // --- PRELOADER ---
  const preloader = document.getElementById('preloader');
  window.addEventListener('load', () => {
    if (!preloader) return;
    preloader.style.opacity = '0';
    setTimeout(() => {
      preloader.style.display = 'none';
    }, 500);
  });

  // --- INITIALIZE AOS ---
  AOS.init({ duration: 1000, once: true, offset: 50 });

  // --- PRODUCT DATA ---
  const products = [
    { id: 1, name: 'Pearl Drop Necklace', price: 2500, image: 'images/image1.png', featured: true },
    { id: 2, name: 'Golden Daisy Hoops', price: 1800, image: 'images/image2.png', featured: true },
    { id: 3, name: 'Classic Pearl Bracelet', price: 2200, image: 'images/image3.png', featured: true },
    { id: 4, name: 'Ocean Blue Beaded Necklace', price: 1600, image: 'images/image4.png', featured: false },
    { id: 5, name: 'Minimalist Gold Chain', price: 1950, image: 'images/image5.png', featured: false },
  ];

  // --- CART LOGIC ---
  let cart = JSON.parse(localStorage.getItem('daisiesCart')) || [];

  function saveCart() {
    localStorage.setItem('daisiesCart', JSON.stringify(cart));
    updateCartCount();
  }

  function updateCartCount() {
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) cartCountElement.textContent = cart.length;
  }

  function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
      cart.push(product);
      saveCart();
      alert(`${product.name} has been added to your cart!`);
    }
  }

  // --- RENDER FUNCTIONS ---
  function renderProducts(containerId, productList) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    productList.forEach((product, index) => {
      const card = document.createElement('div');
      card.className = 'product-card';
      card.setAttribute('data-aos', 'fade-up');
      card.setAttribute('data-aos-delay', index * 100);
      card.innerHTML = `
        <div class="product-image-container">
          <img src="${product.image}" alt="${product.name}">
        </div>
        <h3>${product.name}</h3>
        <p class="product-price">PKR ${product.price.toLocaleString()}</p>
        <button class="add-to-cart-btn" data-id="${product.id}">Add to Cart</button>
      `;
      container.appendChild(card);
    });
  }

  // Aggregate cart to item quantities
  function getCartSummary() {
    const map = {};
    cart.forEach(item => {
      if (!map[item.id]) {
        map[item.id] = { id: item.id, name: item.name, price: item.price, qty: 0 };
      }
      map[item.id].qty += 1;
    });
    return Object.values(map).map(it => ({ ...it, subtotal: it.price * it.qty }));
  }

  function renderOrderSummary() {
    const summaryContainer = document.getElementById('order-summary');
    if (!summaryContainer) return;

    if (cart.length === 0) {
      summaryContainer.innerHTML = '<p>Your cart is empty.</p>';
      const form = document.getElementById('order-form');
      if (form) form.querySelector('button[type="submit"]').disabled = true;
      // clear hidden fields
      const od = document.getElementById('order_details');
      const ta = document.getElementById('total_amount');
      const dt = document.getElementById('display_total');
      if (od) od.value = '';
      if (ta) ta.value = '';
      if (dt) dt.value = '';
      return;
    }

    const items = getCartSummary();
    let html = '<div class="summary-list">';
    let total = 0;
    items.forEach(it => {
      html += `<div class="summary-item"><span>${it.name} x ${it.qty}</span><span>PKR ${it.subtotal.toLocaleString()}</span></div>`;
      total += it.subtotal;
    });
    html += `</div><div class="summary-total"><strong>Total: PKR ${total.toLocaleString()}</strong></div>`;
    summaryContainer.innerHTML = html;

    // Fill hidden inputs and display total
    const orderDetailsInput = document.getElementById('order_details');
    const totalInput = document.getElementById('total_amount');
    const displayTotal = document.getElementById('display_total');

    const orderDetailsStr = items.map(it => `${it.name} x ${it.qty} = PKR ${it.subtotal}`).join(' | ');
    if (orderDetailsInput) orderDetailsInput.value = orderDetailsStr;
    if (totalInput) totalInput.value = total;
    if (displayTotal) displayTotal.value = `PKR ${total.toLocaleString()}`;
  }

  // --- PAGE-SPECIFIC INIT ---
  updateCartCount();

  if (document.getElementById('featured-grid')) {
    const featuredProducts = products.filter(p => p.featured);
    renderProducts('featured-grid', featuredProducts);
  }
  if (document.getElementById('product-grid-full')) {
    renderProducts('product-grid-full', products);
  }

  // Important: DO NOT clear cart here. We'll clear it after successful POST.
  if (document.getElementById('order-summary')) {
    renderOrderSummary();
  }

  // --- EVENT LISTENERS ---
  document.body.addEventListener('click', (event) => {
    if (event.target.classList.contains('add-to-cart-btn')) {
      const productId = parseInt(event.target.getAttribute('data-id'), 10);
      addToCart(productId);
    }
  });

  // FORM SUBMISSION -> send to Netlify function which writes to Google Sheets
  const orderForm = document.getElementById('order-form');
  if (orderForm) {
    orderForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = orderForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Submitting...';

      // Recompute cart summary to ensure integrity
      const items = getCartSummary();
      if (items.length === 0) {
        alert('Your cart is empty.');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        return;
      }
      const orderDetailsStr = items.map(it => `${it.name} x ${it.qty}`).join(', ');
      const total = items.reduce((s, it) => s + it.subtotal, 0);

      // Collect form values
      const payload = {
        name: document.getElementById('name').value.trim(),
        contact: document.getElementById('contact').value.trim(),
        email: document.getElementById('email').value.trim(),
        address: document.getElementById('address').value.trim(),
        city: document.getElementById('city').value.trim(),
        order_details: orderDetailsStr,
        total_amount: total
      };

      // Basic validation
      if (!payload.name || !payload.contact || !payload.email || !payload.address || !payload.city) {
        document.getElementById('form-message').innerHTML = '<p class="error">Please fill all fields.</p>';
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        return;
      }

      try {
        const res = await fetch('/.netlify/functions/submit-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || 'Failed to submit order');
        }

        // Success — clear cart and inform user
        localStorage.removeItem('daisiesCart');
        cart = [];
        updateCartCount();
        renderOrderSummary();

        document.getElementById('form-message').innerHTML = '<p class="success">Order submitted successfully — thank you! We will contact you soon.</p>';
        submitBtn.textContent = 'Submitted';
      } catch (err) {
        console.error(err);
        document.getElementById('form-message').innerHTML = `<p class="error">Error submitting order: ${err.message}</p>`;
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }
});
