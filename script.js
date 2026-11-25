(() => {
  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  if (!reduce) root.classList.add("rv");

  /* ---------- Split text into words (text stays in DOM for SEO/AI) ---------- */
  const splitEl = (el) => {
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            const w = document.createElement("span");
            w.className = "w";
            const inner = document.createElement("span");
            inner.textContent = part;
            inner.style.setProperty("--i", i++);
            w.appendChild(inner);
            frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !n.classList.contains("w")) {
          // wrap whole element (e.g. <em>) as one unit of words
          walk(n);
        }
      });
    };
    walk(el);
  };
  if (!reduce) $$(".split, .split-lines").forEach(splitEl);

  /* ---------- Curtain intro ---------- */
  const curtain = $(".curtain");
  const finishIntro = () => {
    root.classList.add("loaded");
    if (curtain) {
      curtain.classList.add("open");
      setTimeout(() => curtain.classList.add("gone"), 1400);
    }
    $$(".hero .split, .phero .split").forEach((sp) => { sp.style.setProperty("--d0", curtain ? "450ms" : "150ms"); sp.classList.add("in"); });
  };
  if (reduce) {
    root.classList.add("loaded");
  } else if (!curtain) {
    requestAnimationFrame(() => setTimeout(finishIntro, 40));
  } else {
    let done = false;
    const go = () => { if (!done) { done = true; finishIntro(); } };
    const start = performance.now();
    const ready = () => setTimeout(go, Math.max(0, 1500 - (performance.now() - start)));
    const heroImg = $(".hero__media img");
    if (heroImg && !heroImg.complete) { heroImg.addEventListener("load", ready, { once: true }); heroImg.addEventListener("error", ready, { once: true }); }
    else ready();
    setTimeout(go, 3200); // failsafe
  }

  /* ---------- Preview bar ---------- */
  const pv = $(".preview-bar");
  $(".preview-bar__x")?.addEventListener("click", () => pv.classList.add("hide"));

  /* ---------- Scroll: nav, progress, parallax, timeline, rail bar ---------- */
  const nav = $(".nav");
  const bar = $(".progress span");
  const par = $$("[data-parallax]");
  const tl = $("[data-timeline]");
  const steps = tl ? $$(".step", tl) : [];
  let ticking = false;
  const onScroll = () => {
    const y = scrollY, vh = innerHeight;
    const h = root.scrollHeight - vh;
    if (nav) nav.classList.toggle("scrolled", y > 60);
    if (bar) bar.style.setProperty("--p", h > 0 ? (y / h).toFixed(4) : 0);
    if (!reduce) {
      par.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        const k = parseFloat(el.dataset.parallax) || 0.5;
        const c = (r.top + r.height / 2 - vh / 2) / vh;
        el.style.setProperty("--py", (c * -60 * k).toFixed(1) + "px");
      });
    }
    if (tl) {
      const r = tl.getBoundingClientRect();
      let p = (vh * 0.62 - r.top) / r.height;
      p = reduce ? 1 : Math.max(0, Math.min(1, p));
      tl.style.setProperty("--p", p.toFixed(4));
      steps.forEach((s) => {
        const sr = s.getBoundingClientRect();
        s.classList.toggle("lit", reduce || sr.top + sr.height / 2 < vh * 0.62);
      });
    }
    ticking = false;
  };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener("resize", onScroll);
  onScroll();

  /* ---------- Mobile menu ---------- */
  const toggle = $(".menu-toggle");
  const setMenu = (open) => {
    toggle.setAttribute("aria-expanded", open);
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    nav.classList.toggle("open", open);
    document.body.classList.toggle("menu-open", open);
  };
  toggle?.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
  $$("#menu a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
  addEventListener("keydown", (e) => { if (e.key === "Escape" && nav.classList.contains("open")) { setMenu(false); toggle.focus(); } });

  /* ---------- Reveals ---------- */
  const targets = $$(".reveal, .split, .split-lines, .draw").filter((el) => !el.closest(".hero") && !el.closest(".phero__copy"));
  $$(".reveal").forEach((el) => {
    const sibs = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
    const i = sibs.indexOf(el);
    if (i > 0) el.style.setProperty("--d", Math.min(i * 0.09, 0.6).toFixed(2) + "s");
  });
  if (!reduce && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }), { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });
    targets.forEach((el) => io.observe(el));
    // hero sprigs draw after intro
    setTimeout(() => $$(".hero .draw").forEach((d) => d.classList.add("in")), curtain ? 1600 : 300);
  } else {
    $$(".reveal, .split, .split-lines, .draw").forEach((el) => el.classList.add("in"));
  }

  /* ---------- Magnetic buttons ---------- */
  if (fine && !reduce) {
    $$(".magnetic").forEach((b) => {
      b.addEventListener("pointermove", (e) => {
        const r = b.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
        b.style.setProperty("--mx", (x * 0.28).toFixed(1) + "px");
        b.style.setProperty("--my", (y * 0.4).toFixed(1) + "px");
        b.firstElementChild && (b.firstElementChild.style.transform = `translate(${(x * 0.12).toFixed(1)}px, ${(y * 0.16).toFixed(1)}px)`);
      });
      b.addEventListener("pointerleave", () => {
        b.style.setProperty("--mx", "0px"); b.style.setProperty("--my", "0px");
        b.firstElementChild && (b.firstElementChild.style.transform = "");
      });
    });
  }

  /* ---------- Polaroids: tap to bring forward ---------- */
  $$(".polaroid").forEach((p) => p.addEventListener("click", () => {
    $$(".polaroid").forEach((q) => q !== p && q.classList.remove("lift"));
    p.classList.toggle("lift");
  }));

  /* ---------- Draggable gallery rail ---------- */
  const rail = $("[data-rail]");
  const railBar = $(".rail__bar");
  if (rail) {
    let down = false, moved = false, sx = 0, sl = 0, v = 0, lx = 0, lt = 0, raf;
    const upd = () => {
      const max = rail.scrollWidth - rail.clientWidth;
      railBar?.style.setProperty("--g", max > 0 ? (rail.scrollLeft / max).toFixed(3) : 0);
    };
    rail.addEventListener("scroll", upd, { passive: true });
    upd();
    rail.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse") return; // touch uses native scrolling
      down = true; moved = false; sx = lx = e.clientX; sl = rail.scrollLeft; v = 0; lt = performance.now();
      cancelAnimationFrame(raf);
    });
    addEventListener("pointermove", (e) => {
      if (!down) return;
      const dx = e.clientX - sx;
      if (Math.abs(dx) > 6 && !moved) { moved = true; rail.classList.add("dragging"); }
      if (moved) {
        rail.scrollLeft = sl - dx;
        const now = performance.now();
        v = (e.clientX - lx) / Math.max(1, now - lt); lx = e.clientX; lt = now;
      }
    });
    addEventListener("pointerup", () => {
      if (!down) return;
      down = false;
      setTimeout(() => rail.classList.remove("dragging"), 0);
      if (moved && !reduce) {
        let vel = v * 16;
        const glide = () => { rail.scrollLeft -= vel; vel *= 0.94; if (Math.abs(vel) > 0.4) raf = requestAnimationFrame(glide); };
        glide();
      }
    });
    rail.addEventListener("click", (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    rail.addEventListener("keydown", (e) => {
      if (e.target !== rail) return;
      if (e.key === "ArrowRight") rail.scrollBy({ left: 320, behavior: reduce ? "auto" : "smooth" });
      if (e.key === "ArrowLeft") rail.scrollBy({ left: -320, behavior: reduce ? "auto" : "smooth" });
    });
  }

  /* ---------- Lightbox ---------- */
  const lb = $(".lb");
  if (lb) {
  const items = $$(".g");
  const lbImg = $(".lb img"), lbCap = $(".lb figcaption");
  let idx = 0, lastFocus;
  const show = (i) => {
    idx = (i + items.length) % items.length;
    const it = items[idx], im = it.querySelector("img");
    lbImg.src = it.dataset.full; lbImg.alt = im.alt; lbCap.textContent = im.alt;
    lbImg.style.animation = "none"; void lbImg.offsetWidth; lbImg.style.animation = "";
  };
  const openLb = (i) => { lastFocus = document.activeElement; show(i); lb.hidden = false; document.body.style.overflow = "hidden"; $(".lb__close").focus(); };
  const closeLb = () => { lb.hidden = true; document.body.style.overflow = ""; lastFocus?.focus(); };
  items.forEach((it, i) => it.addEventListener("click", () => openLb(i)));
  $(".lb__close").addEventListener("click", closeLb);
  $(".lb__prev").addEventListener("click", () => show(idx - 1));
  $(".lb__next").addEventListener("click", () => show(idx + 1));
  lb.addEventListener("click", (e) => { if (e.target === lb) closeLb(); });
  addEventListener("keydown", (e) => {
    if (lb.hidden) return;
    if (e.key === "Escape") closeLb();
    if (e.key === "ArrowRight") show(idx + 1);
    if (e.key === "ArrowLeft") show(idx - 1);
    if (e.key === "Tab") { // trap focus
      const f = $$("button", lb); const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  let tx = 0;
  lb.addEventListener("touchstart", (e) => { tx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", (e) => { const d = e.changedTouches[0].clientX - tx; if (Math.abs(d) > 50) show(idx + (d < 0 ? 1 : -1)); });

  }

  /* ---------- Inquiry form -> mailto (sends nothing itself) ---------- */
  const form = $("#inquiry");
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const err = $(".inquiry__err");
    const name = (f.get("name") || "").trim(), email = (f.get("email") || "").trim();
    if (!name || !/^\S+@\S+\.\S+$/.test(email)) { err.textContent = "Please add your names and a valid email."; return; }
    err.textContent = "";
    const type = f.get("type"), date = f.get("date"), msg = (f.get("message") || "").trim();
    const subject = `${type} inquiry${date ? " for " + date : ""}: ${name}`;
    const body = [`Hi Oaks Ranch!`, ``, `Names: ${name}`, `Email: ${email}`, `Phone: ${(f.get("phone") || "").trim() || "-"}`, `Event: ${type}`, `Preferred date: ${date || "Flexible"}`, `Estimated guests: ${(f.get("guests") || "").trim() || "Not sure yet"}`, ``, msg, ``, `I'd love to schedule a tour.`].join("\n");
    location.href = `mailto:theoaksranchbarnweddings@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });

  /* ---------- Testimonial rotator (pauses on hover/focus; no autoplay with reduced motion) ---------- */
  const tq = $("[data-tq]");
  if (tq) {
    const its = $$(".tq__item", tq), dots = $$(".tq__dot");
    let k = 0, timer = null;
    const showQ = (n) => { k = (n + its.length) % its.length; its.forEach((it, i) => it.classList.toggle("is-on", i === k)); dots.forEach((d, i) => d.setAttribute("aria-current", i === k ? "true" : "false")); };
    const play = () => { if (!reduce && !timer) timer = setInterval(() => showQ(k + 1), 6500); };
    const stop = () => { clearInterval(timer); timer = null; };
    dots.forEach((d, i) => d.addEventListener("click", () => { showQ(i); stop(); play(); }));
    const wrapQ = tq.closest("section");
    wrapQ.addEventListener("mouseenter", stop); wrapQ.addEventListener("mouseleave", play);
    wrapQ.addEventListener("focusin", stop); wrapQ.addEventListener("focusout", play);
    play();
  }

  const yr = $("[data-year]"); if (yr) yr.textContent = new Date().getFullYear();
})();
