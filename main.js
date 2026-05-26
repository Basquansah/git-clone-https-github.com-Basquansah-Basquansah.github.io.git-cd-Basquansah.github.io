// =============================================
// TechNova Store – Shared JS (main.js)
// =============================================

(function () {
  "use strict";

  /* ------ Hamburger Menu ------ */
  const hamburger = document.querySelector(".hamburger");
  const navLinks = document.querySelector(".nav-links");
  if (hamburger && navLinks) {
    hamburger.addEventListener("click", () => {
      hamburger.classList.toggle("open");
      navLinks.classList.toggle("open");
      const expanded = hamburger.getAttribute("aria-expanded") === "true";
      hamburger.setAttribute("aria-expanded", String(!expanded));
    });
    // Close on link click
    navLinks.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        hamburger.classList.remove("open");
        navLinks.classList.remove("open");
        hamburger.setAttribute("aria-expanded", "false");
      })
    );
  }

  /* ------ Active Nav Link ------ */
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach((link) => {
    if (link.getAttribute("href") === currentPage) link.classList.add("active");
  });

  /* ------ Cart State (localStorage) ------ */
  function getCart() {
    try { return JSON.parse(localStorage.getItem("tn_cart") || "[]"); } catch { return []; }
  }
  function saveCart(cart) {
    localStorage.setItem("tn_cart", JSON.stringify(cart));
    updateCartBadge();
  }
  function updateCartBadge() {
    const cart = getCart();
    const total = cart.reduce((s, i) => s + i.qty, 0);
    document.querySelectorAll(".cart-badge").forEach((b) => {
      b.textContent = total;
      b.style.display = total ? "flex" : "none";
    });
  }
  window.addToCart = function (id, name, price, img) {
    const cart = getCart();
    const existing = cart.find((i) => i.id === id);
    if (existing) { existing.qty++; } else { cart.push({ id, name, price, img, qty: 1 }); }
    saveCart(cart);
    showToast("✅ Added to cart: " + name, "success");
  };
  window.getCart = getCart;
  window.saveCart = saveCart;
  updateCartBadge();

  /* ------ Toast Notifications ------ */
  function showToast(msg, type = "") {
    let container = document.querySelector(".toast-container");
    if (!container) {
      container = document.createElement("div");
      container.className = "toast-container";
      document.body.appendChild(container);
    }
    const toast = document.createElement("div");
    toast.className = "toast " + type;
    toast.innerHTML = `<span class="toast-icon">${type === "success" ? "✅" : "ℹ️"}</span><span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  }
  window.showToast = showToast;

  /* ------ Navbar Scroll Behaviour ------ */
  const navbar = document.querySelector(".navbar");
  if (navbar) {
    window.addEventListener("scroll", () => {
      navbar.style.boxShadow = window.scrollY > 20
        ? "0 4px 32px rgba(0,0,0,0.5)"
        : "";
    }, { passive: true });
  }

  /* ------ Global Navbar Search ------ */
  const navSearchInput = document.querySelector(".search-bar input");
  const navSearchBtn = document.querySelector(".search-bar button");
  if (navSearchInput && navSearchBtn) {
    function doNavSearch() {
      const q = navSearchInput.value.trim();
      if (q) window.location.href = "shop.html?q=" + encodeURIComponent(q);
    }
    navSearchBtn.addEventListener("click", doNavSearch);
    navSearchInput.addEventListener("keydown", (e) => { if (e.key === "Enter") doNavSearch(); });
  }

  /* ------ On-Page Text Search ------ */
  const pageSearchInput = document.getElementById("pageSearchInput");
  const matchCountEl = document.getElementById("matchCount");
  const prevBtn = document.getElementById("prevMatch");
  const nextBtn = document.getElementById("nextMatch");
  const clearBtn = document.getElementById("clearSearch");

  if (pageSearchInput) {
    let matches = [];
    let currentIdx = -1;

    const searchRoot = document.getElementById("searchable-content") || document.querySelector("main");

    function highlight(term) {
      // Clear existing highlights
      searchRoot.querySelectorAll(".highlight").forEach((el) => {
        const parent = el.parentNode;
        parent.replaceChild(document.createTextNode(el.textContent), el);
        parent.normalize();
      });
      matches = [];
      currentIdx = -1;

      if (!term || term.length < 2) {
        if (matchCountEl) matchCountEl.textContent = "";
        return;
      }
      const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");

      function walk(node) {
        if (node.nodeType === 3) {
          const text = node.textContent;
          if (regex.test(text)) {
            regex.lastIndex = 0;
            const frag = document.createDocumentFragment();
            let last = 0;
            let m;
            while ((m = regex.exec(text)) !== null) {
              frag.appendChild(document.createTextNode(text.slice(last, m.index)));
              const mark = document.createElement("mark");
              mark.className = "highlight";
              mark.textContent = m[0];
              matches.push(mark);
              frag.appendChild(mark);
              last = regex.lastIndex;
            }
            frag.appendChild(document.createTextNode(text.slice(last)));
            node.parentNode.replaceChild(frag, node);
          }
        } else if (
          node.nodeType === 1 &&
          !["SCRIPT", "STYLE", "MARK", "INPUT", "TEXTAREA"].includes(node.tagName)
        ) {
          Array.from(node.childNodes).forEach(walk);
        }
      }
      walk(searchRoot);
      if (matchCountEl) matchCountEl.textContent = matches.length ? `${matches.length} match${matches.length > 1 ? "es" : ""}` : "No matches";
      if (matches.length) jumpTo(0);
    }

    function jumpTo(idx) {
      matches.forEach((m) => m.classList.remove("current"));
      if (!matches.length) return;
      currentIdx = (idx + matches.length) % matches.length;
      matches[currentIdx].classList.add("current");
      matches[currentIdx].scrollIntoView({ block: "center", behavior: "smooth" });
      if (matchCountEl) matchCountEl.textContent = `${currentIdx + 1} / ${matches.length}`;
    }

    let debounceTimer;
    pageSearchInput.addEventListener("input", () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => highlight(pageSearchInput.value.trim()), 280);
    });
    if (prevBtn) prevBtn.addEventListener("click", () => jumpTo(currentIdx - 1));
    if (nextBtn) nextBtn.addEventListener("click", () => jumpTo(currentIdx + 1));
    if (clearBtn) clearBtn.addEventListener("click", () => {
      pageSearchInput.value = "";
      highlight("");
      if (matchCountEl) matchCountEl.textContent = "";
    });
    pageSearchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); jumpTo(currentIdx + 1); }
      if (e.key === "Escape") { clearBtn && clearBtn.click(); }
    });
  }

  /* ------ High Contrast Toggle ------ */
  const contrastBtn = document.getElementById("contrastToggle");
  if (contrastBtn) {
    const stored = localStorage.getItem("tn_contrast") === "1";
    if (stored) document.body.classList.add("high-contrast");
    contrastBtn.addEventListener("click", () => {
      document.body.classList.toggle("high-contrast");
      const on = document.body.classList.contains("high-contrast");
      localStorage.setItem("tn_contrast", on ? "1" : "0");
      showToast(on ? "High contrast mode ON" : "High contrast mode OFF");
    });
  }

  /* ------ Font Size Toggle (Accessibility) ------ */
  const fontBtn = document.getElementById("fontSizeToggle");
  if (fontBtn) {
    let size = parseInt(localStorage.getItem("tn_fontsize") || "16");
    document.documentElement.style.fontSize = size + "px";
    fontBtn.addEventListener("click", () => {
      size = size >= 20 ? 14 : size + 2;
      document.documentElement.style.fontSize = size + "px";
      localStorage.setItem("tn_fontsize", size);
      showToast("Font size: " + size + "px");
    });
  }

  /* ------ Category pill filter on shop page ------ */
  const catPills = document.querySelectorAll(".cat-pill");
  if (catPills.length) {
    catPills.forEach((pill) => {
      pill.addEventListener("click", () => {
        catPills.forEach((p) => p.classList.remove("active"));
        pill.classList.add("active");
        const cat = pill.dataset.cat;
        document.querySelectorAll(".product-card[data-cat]").forEach((card) => {
          card.closest(".product-col").style.display =
            cat === "all" || card.dataset.cat === cat ? "" : "none";
        });
      });
    });
  }

  /* ------ Qty buttons on cart page ------ */
  document.querySelectorAll(".qty-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const row = btn.closest("tr");
      if (!row) return;
      const qtyEl = row.querySelector(".qty-num");
      let qty = parseInt(qtyEl.textContent);
      if (btn.dataset.action === "inc") qty++;
      else if (btn.dataset.action === "dec" && qty > 1) qty--;
      qtyEl.textContent = qty;
      // Update subtotal
      const price = parseFloat(row.dataset.price);
      const subtotalEl = row.querySelector(".item-subtotal");
      if (subtotalEl) subtotalEl.textContent = "GH₵ " + (price * qty).toFixed(2);
      updateCartTotals();
    });
  });

  function updateCartTotals() {
    let sub = 0;
    document.querySelectorAll("#cartBody tr").forEach((row) => {
      const qty = parseInt(row.querySelector(".qty-num")?.textContent || 0);
      const price = parseFloat(row.dataset.price || 0);
      sub += qty * price;
    });
    const shipping = sub > 0 ? 25 : 0;
    const total = sub + shipping;
    const el = (id) => document.getElementById(id);
    if (el("subtotalEl")) el("subtotalEl").textContent = "GH₵ " + sub.toFixed(2);
    if (el("shippingEl")) el("shippingEl").textContent = shipping > 0 ? "GH₵ " + shipping.toFixed(2) : "FREE";
    if (el("totalEl")) el("totalEl").textContent = "GH₵ " + total.toFixed(2);
  }
  updateCartTotals();

})();
