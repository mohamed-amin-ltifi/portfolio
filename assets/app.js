
/* =========================================================================
   PORTFOLIO — JavaScript (vanilla, sans dépendance)
   1. Thème clair / sombre + mémorisation
   2. Menu mobile
   3. Surlignage de la section active
   4. Animations au défilement (IntersectionObserver)
   5. Barres de compétences + chiffres animés
   6. Filtres de projets
   7. Modale projet (ouverture, fermeture, clavier)
   8. Validation du formulaire de contact
   9. Bouton retour en haut
   ========================================================================= */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     1. THÈME CLAIR / SOMBRE
     Le choix est mémorisé dans localStorage sous la clé "theme".
     ------------------------------------------------------------------ */
  const root = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');

  // Au chargement : préférence enregistrée, sinon préférence système
  const savedTheme = localStorage.getItem('theme');
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  root.setAttribute('data-theme', savedTheme || (systemDark ? 'dark' : 'light'));

  themeToggle.addEventListener('click', function () {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  });

  /* ------------------------------------------------------------------
     2. MENU MOBILE (burger)
     ------------------------------------------------------------------ */
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');

  function closeNav() {
    nav.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
  }

  burger.addEventListener('click', function () {
    const open = nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(open));
  });

  // On referme le menu après un clic sur un lien
  nav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', closeNav);
  });

  /* ------------------------------------------------------------------
     3. SURLIGNAGE DE LA SECTION ACTIVE
     On observe les sections et on active le lien correspondant.
     ------------------------------------------------------------------ */
  const navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav__link'));
  const sections = navLinks
    .map(function (l) { return document.querySelector(l.getAttribute('href')); })
    .filter(Boolean);

  const navObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      const id = '#' + entry.target.id;
      navLinks.forEach(function (l) {
        l.classList.toggle('is-active', l.getAttribute('href') === id);
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

  sections.forEach(function (s) { navObserver.observe(s); });

  /* ------------------------------------------------------------------
     4. ANIMATIONS AU DÉFILEMENT
     Désactivées par défaut : le contenu est toujours visible, même si
     le JavaScript ne s'exécute pas (aperçu, impression, très vieux
     navigateur). Pour les activer, passer ANIMATIONS_ACTIVEES à true.
     ------------------------------------------------------------------ */
  const ANIMATIONS_ACTIVEES = false;

  if (ANIMATIONS_ACTIVEES) {
    const revealEls = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target); // une seule fois
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ------------------------------------------------------------------
     5a. BARRES DE COMPÉTENCES
     La largeur est calculée à partir de data-level (niveau sur 5).
     ------------------------------------------------------------------ */
  const bars = document.querySelectorAll('.bar__fill');
  const barObserver = new IntersectionObserver(function (entries, obs) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      const level = Number(entry.target.dataset.level) || 0;
      entry.target.style.width = (level / 5) * 100 + '%';
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.4 });
  bars.forEach(function (b) { barObserver.observe(b); });

  /* ------------------------------------------------------------------
     5b. CHIFFRES CLÉS ANIMÉS
     ------------------------------------------------------------------ */
  const counters = document.querySelectorAll('.stat__num');
  const counterObserver = new IntersectionObserver(function (entries, obs) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = Number(el.dataset.count) || 0;
      const suffix = el.dataset.suffix || '';
      // Pas d'animation : on affiche directement la valeur finale
      if (!ANIMATIONS_ACTIVEES) {
        el.textContent = target + suffix;
        obs.unobserve(el);
        return;
      }
      const duration = 1100;
      const start = performance.now();

      function tick(now) {
        const p = Math.min((now - start) / duration, 1);
        // easing "easeOutCubic"
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      obs.unobserve(el);
    });
  }, { threshold: 0.6 });
  counters.forEach(function (c) { counterObserver.observe(c); });

  /* ------------------------------------------------------------------
     6. FILTRES DE PROJETS
     data-cat sur chaque carte, data-filter sur chaque bouton.
     ------------------------------------------------------------------ */
  const filterBtns = document.querySelectorAll('.filter');
  const projectCards = document.querySelectorAll('.project');

  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterBtns.forEach(function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');
      const cat = btn.dataset.filter;

      projectCards.forEach(function (card) {
        const show = cat === 'all' || card.dataset.cat === cat;
        card.style.display = show ? '' : 'none';
      });
    });
  });

  /* ------------------------------------------------------------------
     7c. LIGHTBOX — capture en taille réelle
     Un clic sur une capture l'ouvre en pleine taille ; Échap ou un clic
     n'importe où la referme.
     ------------------------------------------------------------------ */
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');
  const lightboxCounter = document.getElementById('lightboxCounter');

  // Liste courante de captures (pour le swipe / les flèches)
  let lbItems = [];
  let lbIndex = 0;

  function showLightboxAt(i) {
    if (!lbItems.length) return;
    lbIndex = (i + lbItems.length) % lbItems.length;
    const item = lbItems[lbIndex];
    lightboxImg.src = item.full;
    lightboxImg.alt = item.alt || '';
    lightboxCounter.textContent = (lbIndex + 1) + ' / ' + lbItems.length;
  }

  function openLightbox(items, index) {
    lbItems = items;
    showLightboxAt(index);
    lightbox.classList.add('is-open');
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    lightboxImg.src = '';
  }

  lightboxPrev.addEventListener('click', function (e) { e.stopPropagation(); showLightboxAt(lbIndex - 1); });
  lightboxNext.addEventListener('click', function (e) { e.stopPropagation(); showLightboxAt(lbIndex + 1); });

  // --- Swipe tactile (mobile / tablette) et glisser à la souris ---
  let touchStartX = null, touchStartY = null;

  lightbox.addEventListener('touchstart', function (e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  lightbox.addEventListener('touchend', function (e) {
    if (touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    touchStartX = touchStartY = null;
    // Geste horizontal franc uniquement (sinon c'est un tap = fermer)
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
      e.preventDefault();
      showLightboxAt(lbIndex + (dx < 0 ? 1 : -1));
    }
  }, { passive: false });

  let dragStartX = null, dragged = false;
  lightbox.addEventListener('mousedown', function (e) {
    dragStartX = e.clientX; dragged = false;
  });
  lightbox.addEventListener('mousemove', function (e) {
    if (dragStartX === null) return;
    if (Math.abs(e.clientX - dragStartX) > 45) { dragged = true; }
  });
  lightbox.addEventListener('mouseup', function (e) {
    if (dragStartX === null) return;
    const dx = e.clientX - dragStartX;
    dragStartX = null;
    if (dragged && Math.abs(dx) > 45) {
      showLightboxAt(lbIndex + (dx < 0 ? 1 : -1));
      dragged = false;
      return;
    }
    // Un simple clic ferme la visionneuse — SAUF sur les boutons ‹ › ✕
    if (e.target.closest('.lightbox__nav, .lightbox__close')) return;
    if (e.target !== lightboxImg) closeLightbox();
  });

  // Flèches du clavier
  document.addEventListener('keydown', function (e) {
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'ArrowRight') showLightboxAt(lbIndex + 1);
    if (e.key === 'ArrowLeft') showLightboxAt(lbIndex - 1);
  });

  // --- Pop-up « code source privé » -----------------------------------
  const privateModal = document.getElementById('privateModal');

  function openPrivateModal(projectName) {
    const name = document.getElementById('privateProject');
    if (name) name.textContent = projectName || 'ce projet';
    privateModal.classList.add('is-open');
    privateModal.setAttribute('aria-hidden', 'false');
  }

  function closePrivateModal() {
    privateModal.classList.remove('is-open');
    privateModal.setAttribute('aria-hidden', 'true');
  }

  if (privateModal) {
    privateModal.querySelectorAll('[data-close]').forEach(function (el) {
      el.addEventListener('click', closePrivateModal);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closePrivateModal();
    });
  }


  /* ------------------------------------------------------------------
     7. MODALE PROJET
     Les données viennent des attributs data-* de chaque carte.
     ------------------------------------------------------------------ */
  const modal = document.getElementById('modal');
  const modalGallery = document.getElementById('modalGallery');
  const modalTrack = document.getElementById('modalTrack');
  const modalDots = document.getElementById('modalDots');
  const modalHint = document.getElementById('modalHint');
  const modalTitle = document.getElementById('modalTitle');
  const modalMeta = document.getElementById('modalMeta');
  const modalContext = document.getElementById('modalContext');
  const modalRole = document.getElementById('modalRole');
  const modalSolution = document.getElementById('modalSolution');
  const modalResult = document.getElementById('modalResult');
  const modalTags = document.getElementById('modalTags');
  const modalLink = document.getElementById('modalLink');
  const modalRepo = document.getElementById('modalRepo');
  let lastFocused = null;

  function openModal(card) {
    lastFocused = document.activeElement;
    // Captures de la carte → carrousel horizontal natif
    const shots = card.querySelectorAll('.project__thumb img');
    const items = [];
    shots.forEach(function (src) {
      items.push({ full: src.dataset.full || src.src, alt: src.alt || '' });
    });

    modalTrack.innerHTML = '';
    modalDots.innerHTML = '';
    items.forEach(function (item, index) {
      const img = document.createElement('img');
      img.src = item.full;
      img.alt = item.alt;
      img.loading = 'lazy';
      img.addEventListener('click', function () { openLightbox(items, index); });
      modalTrack.appendChild(img);

      const dot = document.createElement('span');
      if (index === 0) dot.className = 'is-active';
      modalDots.appendChild(dot);
    });
    modalTrack.scrollLeft = 0;
    modalHint.textContent = items.length > 1
      ? items.length + ' captures · glissez pour faire défiler'
      : '';
    modalHint.style.display = items.length > 1 ? '' : 'none';
    modalDots.style.display = items.length > 1 ? '' : 'none';

    modalTitle.innerHTML = card.dataset.title || '';
    modalMeta.innerHTML = card.querySelector('.project__meta').innerHTML;
    modalContext.innerHTML = card.dataset.context || '';
    modalRole.innerHTML = card.dataset.role || '';
    modalSolution.innerHTML = card.dataset.solution || '';
    modalResult.innerHTML = card.dataset.result || '';

    modalTags.innerHTML = '';
    (card.dataset.tags || '').split(',').filter(Boolean).forEach(function (t) {
      const span = document.createElement('span');
      span.className = 'tag';
      span.textContent = t.trim();
      modalTags.appendChild(span);
    });

    modalLink.href = card.dataset.link || '#';

    // Code source : soit un vrai dépôt, soit un projet privé (pop-up)
    const repo = card.dataset.repo || '';
    const isPrivate = !repo || repo === '#' || card.dataset.private === '1';
    modalRepo.textContent = isPrivate ? 'Code source (privé)' : 'Code source';
    modalRepo.setAttribute('data-private', isPrivate ? '1' : '0');
    modalRepo.setAttribute('data-project', card.dataset.title || '');
    modalRepo.href = isPrivate ? '#' : repo;
    modalRepo.setAttribute('aria-disabled', isPrivate ? 'true' : 'false');

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    modal.querySelector('.modal__close').focus();
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    if (lastFocused) lastFocused.focus();
  }

  projectCards.forEach(function (card) {
    card.addEventListener('click', function () { openModal(card); });
  });

  modal.querySelectorAll('[data-close]').forEach(function (el) {
    el.addEventListener('click', closeModal);
  });

  // Un lien marqué data-private="1" n'ouvre pas d'URL : il affiche le pop-up
  // (capture : ce gestionnaire doit s'exécuter avant celui qui ferme la modale)
  modal.addEventListener('click', function (e) {
    const link = e.target.closest('a[data-private="1"]');
    if (!link) return;
    e.preventDefault();
    e.stopPropagation();
    openPrivateModal(link.dataset.project || '');
  }, true);

  /* ------------------------------------------------------------------
     7d. CARROUSEL DES CAPTURES
     Le défilement horizontal est natif (CSS scroll-snap) : le swipe au
     doigt fonctionne même si ce script ne s'exécute pas. Ici on ajoute
     seulement les points indicateurs et le glisser à la souris.
     ------------------------------------------------------------------ */
  const modalImages = function () { return modalTrack.querySelectorAll('img'); };

  // Met à jour les points indicateurs selon l'image visible
  function syncDots() {
    const dots = modalDots.querySelectorAll('span');
    if (!dots.length) return;
    const w = modalTrack.clientWidth || 1;
    const current = Math.round(modalTrack.scrollLeft / w);
    dots.forEach(function (d, k) {
      d.classList.toggle('is-active', k === current);
    });
  }



  // Boutons précédent / suivant : défilement d'une image à la fois
  function trackStep(dir) {
    const imgs = modalTrack.querySelectorAll('img');
    if (!imgs.length) return;
    const w = modalTrack.clientWidth || 1;
    // On se cale sur l'index de l'image visible, pas sur un pourcentage
    let i = Math.round(modalTrack.scrollLeft / w) + dir;
    i = Math.max(0, Math.min(imgs.length - 1, i));
    // behavior:'auto' : le défilement instantané est le seul fiable partout
    // (le 'smooth' est annulé par certains moteurs et par le snap CSS)
    modalTrack.scrollTo({ left: i * w, behavior: 'auto' });
  }
  const trackPrev = document.getElementById('modalPrev');
  const trackNext = document.getElementById('modalNext');
  if (trackPrev) trackPrev.addEventListener('click', function (e) { e.stopPropagation(); trackStep(-1); });
  if (trackNext) trackNext.addEventListener('click', function (e) { e.stopPropagation(); trackStep(1); });
  if (trackPrev) trackPrev.addEventListener('click', syncDots);
  if (trackNext) trackNext.addEventListener('click', syncDots);

  // Points indicateurs synchronisés avec la position de défilement
  modalTrack.addEventListener('scroll', function () {
    const imgs = modalImages();
    if (!imgs.length) return;
    const w = modalTrack.clientWidth || 1;
    const i = Math.round(modalTrack.scrollLeft / w);
    // Les points suivent l'image réellement visible
    syncDots();
  }, { passive: true });

  // Glisser à la souris (ordinateur) : on translate le défilement
  let trackDown = false, trackStartX = 0, trackStartScroll = 0, trackMoved = false;

  modalTrack.addEventListener('mousedown', function (e) {
    trackDown = true; trackMoved = false;
    trackStartX = e.clientX;
    trackStartScroll = modalTrack.scrollLeft;
    modalTrack.classList.add('is-dragging');
  });

  window.addEventListener('mousemove', function (e) {
    if (!trackDown) return;
    const dx = e.clientX - trackStartX;
    if (Math.abs(dx) > 5) trackMoved = true;
    modalTrack.scrollLeft = trackStartScroll - dx;
  });

  window.addEventListener('mouseup', function () {
    if (!trackDown) return;
    trackDown = false;
    modalTrack.classList.remove('is-dragging');
  });

  // Un vrai glisser ne doit pas déclencher le zoom (clic sur l'image)
  modalTrack.addEventListener('click', function (e) {
    if (trackMoved) { e.stopPropagation(); e.preventDefault(); trackMoved = false; }
  }, true);

  /* ------------------------------------------------------------------
     7b. DIAPORAMA DES CAPTURES (cartes projets)
     Une carte qui contient plusieurs images .shot les fait défiler
     automatiquement toutes les 2,5 s.
     ------------------------------------------------------------------ */
  document.querySelectorAll('.project__thumb').forEach(function (thumb) {
    const shots = thumb.querySelectorAll('.shot');
    if (shots.length < 2) return;
    let i = 0;
    setInterval(function () {
      shots[i].style.opacity = '0';
      i = (i + 1) % shots.length;
      shots[i].style.opacity = '1';
    }, 2500);
  });

  // Fermeture avec la touche Échap
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (lightbox.classList.contains('is-open')) { closeLightbox(); return; }
    if (modal.classList.contains('is-open')) closeModal();
  });

  /* ------------------------------------------------------------------
     8. FORMULAIRE DE CONTACT — validation côté client
     Ici, aucun serveur n'est branché : le message est simplement
     validé puis confirmé à l'utilisateur. Voir le guide pour brancher
     Formspree / Netlify Forms / votre propre API.
     ------------------------------------------------------------------ */
  const form = document.getElementById('contactForm');
  const formSuccess = document.getElementById('formSuccess');

  function setError(field, hasError) {
    field.classList.toggle('has-error', hasError);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    let valid = true;

    const name = document.getElementById('name');
    const email = document.getElementById('email');
    const message = document.getElementById('message');

    const nameOk = name.value.trim().length >= 2;
    setError(name.closest('.field'), !nameOk);
    if (!nameOk) valid = false;

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim());
    setError(email.closest('.field'), !emailOk);
    if (!emailOk) valid = false;

    const msgOk = message.value.trim().length >= 20;
    setError(message.closest('.field'), !msgOk);
    if (!msgOk) valid = false;

    if (!valid) {
      formSuccess.classList.remove('is-visible');
      form.querySelector('.has-error input, .has-error textarea').focus();
      return;
    }

    /* ---- À BRANCHER ICI ----
       Exemple avec Formspree :
       fetch('https://formspree.io/f/VOTRE_ID', {
         method: 'POST',
         headers: { 'Accept': 'application/json' },
         body: new FormData(form)
       }).then(...)
       ------------------------ */

    formSuccess.classList.add('is-visible');
    form.reset();
    formSuccess.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  // On retire l'erreur dès que l'utilisateur corrige
  form.querySelectorAll('input, textarea').forEach(function (input) {
    input.addEventListener('input', function () {
      input.closest('.field').classList.remove('has-error');
    });
  });

  /* ------------------------------------------------------------------
     9. BOUTON RETOUR EN HAUT
     ------------------------------------------------------------------ */
  const toTop = document.getElementById('toTop');
  window.addEventListener('scroll', function () {
    toTop.classList.toggle('is-visible', window.scrollY > 500);
  }, { passive: true });

  toTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ------------------------------------------------------------------
     Année du pied de page
     ------------------------------------------------------------------ */
  document.getElementById('year').textContent = new Date().getFullYear();
})();
