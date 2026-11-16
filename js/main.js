/* =========================================================
   DEC Crane – site scriptleri (vanilla JS, kütüphane yok)
   Her sayfada çalışır; öğe yoksa ilgili bölüm atlanır.
   ========================================================= */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- Hero slider (anasayfa) ---------- */
  const hero = $("#hero");
  if (hero) {
    const slides = $$(".slide", hero);
    let cur = 0, timer;
    const go = i => {
      slides[cur].classList.remove("active");
      cur = (i + slides.length) % slides.length;
      slides[cur].classList.add("active");
    };
    const restart = () => { clearInterval(timer); timer = setInterval(() => go(cur + 1), 7000); };
    $(".prev", hero).addEventListener("click", () => { go(cur - 1); restart(); });
    $(".next", hero).addEventListener("click", () => { go(cur + 1); restart(); });
    let tx = 0;
    hero.addEventListener("touchstart", e => { tx = e.touches[0].clientX; }, { passive: true });
    hero.addEventListener("touchend", e => {
      const dx = e.changedTouches[0].clientX - tx;
      if (Math.abs(dx) > 50) { go(cur + (dx < 0 ? 1 : -1)); restart(); }
    });
    restart();
  }

  /* ---------- Referans carousel (sürüklenebilir, sonsuz) ---------- */
  const slider = $("#refSlider"), track = $("#refTrack");
  if (slider && track && track.children.length) {
    const half = track.children.length / 2;
    let offset = 0, startX = 0, startOff = 0, dragging = false, setW = 0;
    const measure = () => { setW = track.children[half].offsetLeft - track.children[0].offsetLeft; };
    const apply = () => {
      if (setW) { while (offset <= -setW) offset += setW; while (offset > 0) offset -= setW; }
      track.style.transform = `translate3d(${offset}px,0,0)`;
    };
    const down = x => { dragging = true; startX = x; startOff = offset; slider.classList.add("dragging"); track.style.transition = "none"; };
    const move = x => { if (dragging) { offset = startOff + (x - startX); apply(); } };
    const up = () => {
      if (!dragging) return;
      dragging = false; slider.classList.remove("dragging");
      const step = track.children[1].offsetLeft - track.children[0].offsetLeft;
      offset = Math.round(offset / step) * step;
      track.style.transition = "transform .4s cubic-bezier(.22,.61,.36,1)";
      track.style.transform = `translate3d(${offset}px,0,0)`;
      setTimeout(() => { track.style.transition = "none"; apply(); }, 420);
    };
    slider.addEventListener("mousedown", e => { e.preventDefault(); down(e.clientX); });
    addEventListener("mousemove", e => move(e.clientX));
    addEventListener("mouseup", up);
    slider.addEventListener("touchstart", e => down(e.touches[0].clientX), { passive: true });
    slider.addEventListener("touchmove", e => move(e.touches[0].clientX), { passive: true });
    slider.addEventListener("touchend", up);
    addEventListener("load", measure);
    addEventListener("resize", () => { measure(); apply(); });
    measure();
  }

  /* ---------- Mobil menü ---------- */
  const burger = $("#hamburger"), nav = $("#mainNav"), overlay = $("#navOverlay"), closeBtn = $("#navClose");
  if (burger && nav) {
    const setNav = open => {
      nav.classList.toggle("open", open);
      burger.classList.toggle("open", open);
      overlay && overlay.classList.toggle("show", open);
      burger.setAttribute("aria-expanded", open);
      document.body.style.overflow = open ? "hidden" : "";
    };
    burger.addEventListener("click", () => setNav(!nav.classList.contains("open")));
    overlay && overlay.addEventListener("click", () => setNav(false));
    closeBtn && closeBtn.addEventListener("click", () => setNav(false));
    addEventListener("keydown", e => { if (e.key === "Escape") setNav(false); });
    $$(".sub-toggle", nav).forEach(b => b.addEventListener("click", () => {
      const li = b.parentElement, sub = $(".sub-menu", li);
      const open = li.classList.toggle("open");
      sub.style.maxHeight = open ? sub.scrollHeight + "px" : "0";
    }));
    addEventListener("resize", () => { if (innerWidth >= 1200) setNav(false); });
  }

  /* ---------- Lightbox (galeri) ---------- */
  const links = $$("[data-lightbox]");
  if (links.length) {
    const lb = document.createElement("div");
    lb.className = "lightbox";
    lb.innerHTML = '<button class="lb-btn lb-close" aria-label="Kapat">&times;</button><button class="lb-btn lb-prev" aria-label="Önceki">&#8249;</button><img alt=""><button class="lb-btn lb-next" aria-label="Sonraki">&#8250;</button>';
    document.body.appendChild(lb);
    const img = $("img", lb);
    let i = 0;
    const show = n => { i = (n + links.length) % links.length; img.src = links[i].href; };
    const open = n => { show(n); lb.classList.add("open"); document.body.style.overflow = "hidden"; };
    const close = () => { lb.classList.remove("open"); document.body.style.overflow = ""; };
    links.forEach((a, n) => a.addEventListener("click", e => { e.preventDefault(); open(n); }));
    $(".lb-close", lb).addEventListener("click", close);
    $(".lb-prev", lb).addEventListener("click", () => show(i - 1));
    $(".lb-next", lb).addEventListener("click", () => show(i + 1));
    lb.addEventListener("click", e => { if (e.target === lb) close(); });
    addEventListener("keydown", e => {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(i - 1);
      if (e.key === "ArrowRight") show(i + 1);
    });
  }

  /* ---------- İletişim formu (send.php'ye AJAX) ---------- */
  const form = $("#contactForm");
  if (form) {
    const status = $(".form-status", form);
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const btn = $("button[type=submit]", form);
      btn.disabled = true; status.className = "form-status"; status.textContent = "Sending...";
      try {
        const res = await fetch(form.action, { method: "POST", body: new FormData(form), headers: { "Accept": "application/json" } });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.ok === false) throw new Error(data.message || "Error");
        status.classList.add("ok"); status.textContent = data.message || "Your message has been sent. Thank you!";
        form.reset();
      } catch (err) {
        status.classList.add("err"); status.textContent = "Message could not be sent. Please email info@deccrane.com.";
      } finally { btn.disabled = false; }
    });
  }

  /* ---------- Yukarı çık (ilerleme halkalı) ---------- */
  const toTop = $("#toTop"), ring = $("#ring"), footer = $(".site-footer");
  if (toTop && ring) {
    const C = 2 * Math.PI * 24;
    const onScroll = () => {
      const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
      toTop.classList.toggle("show", y > 200);
      ring.style.strokeDashoffset = C - (max > 0 ? y / max : 0) * C;
      if (footer) toTop.classList.toggle("on-light", footer.getBoundingClientRect().top > innerHeight - 55);
    };
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    toTop.addEventListener("click", () => scrollTo({ top: 0, behavior: "smooth" }));
  }

  /* ---------- Dil seçimi ---------- */
  $$(".lang a").forEach(a => a.addEventListener("click", e => {
    const target = a.dataset.href;
    if (target) return; // TR sayfaları eklendiğinde data-href ile yönlendirir
    e.preventDefault();
  }));
})();
