'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const lightMedia = window.matchMedia('(prefers-color-scheme: light)');
  const root = document.documentElement;
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const themeToggle = document.getElementById('theme-toggle');
  const header = document.getElementById('site-header');
  const menuToggle = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileMenuClose = document.getElementById('mobile-menu-close');
  const menuLinks = mobileMenu ? mobileMenu.querySelectorAll('a[href^="#"]') : [];
  const certificateDialog = document.getElementById('certificate-dialog');
  const certificateDialogImage = document.getElementById('certificate-dialog-image');
  const certificateDialogCaption = document.getElementById('certificate-dialog-caption');
  const certificateDialogMeta = document.getElementById('certificate-dialog-meta');
  const certificateDialogVerify = document.getElementById('certificate-dialog-verify');
  const certificateDialogPrev = document.getElementById('certificate-dialog-prev');
  const certificateDialogNext = document.getElementById('certificate-dialog-next');
  const certificateDialogClose = document.getElementById('certificate-dialog-close');
  const certificateTriggers = Array.from(document.querySelectorAll('[data-certificate-trigger]'));
  const copyEmailBtn = document.getElementById('copy-email-btn');
  const copyEmailStatus = document.getElementById('copy-email-status');
  const hallTriggers = document.querySelectorAll('[data-hall-trigger]');
  const hallTitleEl = document.getElementById('museum-hall-title');
  const hallEraEl = document.getElementById('museum-hall-era');
  const hallDetailEl = document.getElementById('museum-hall-detail');
  const hallAudioEl = document.getElementById('museum-hall-audio');

  let lastCertificateTrigger = null;
  let currentCertificateIndex = 0;

  root.classList.add('js');

  // 1. Theme System (respects OS preference + explicit toggle)
  const getEffectiveTheme = () => {
    const explicit = root.dataset.theme;
    if (explicit === 'light' || explicit === 'dark') return explicit;
    return lightMedia.matches ? 'light' : 'dark';
  };

  const syncThemeUI = (theme) => {
    if (themeMeta) {
      themeMeta.setAttribute('content', theme === 'light' ? '#f5f6ef' : '#0a0e0c');
    }
    if (themeToggle) {
      const nextLabel = theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme';
      themeToggle.setAttribute('aria-label', nextLabel);
      themeToggle.setAttribute('title', nextLabel);
      themeToggle.setAttribute('aria-pressed', String(theme === 'light'));
    }
    window.dispatchEvent(new CustomEvent('portfolio:themechange', { detail: { theme } }));
  };

  try {
    const saved = window.localStorage.getItem('portfolio-theme');
    if (saved === 'light' || saved === 'dark') {
      root.dataset.theme = saved;
    }
  } catch {
    // Ignore storage access errors in restricted browsing contexts
  }
  syncThemeUI(getEffectiveTheme());

  themeToggle?.addEventListener('click', () => {
    const nextTheme = getEffectiveTheme() === 'light' ? 'dark' : 'light';
    root.dataset.theme = nextTheme;
    try {
      window.localStorage.setItem('portfolio-theme', nextTheme);
    } catch {
      // Ignore storage access errors
    }
    syncThemeUI(nextTheme);
  });

  lightMedia.addEventListener('change', () => {
    if (!root.dataset.theme) {
      syncThemeUI(getEffectiveTheme());
    }
  });

  // 2. Sticky Header State
  const setHeaderState = () => {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 20);
  };
  setHeaderState();
  window.addEventListener('scroll', setHeaderState, { passive: true });

  // 3. Progressive Scroll Reveal
  const revealItems = document.querySelectorAll('[data-reveal]');
  if (!reducedMotion.matches && 'IntersectionObserver' in window && revealItems.length) {
    root.classList.add('motion-ready');
    const revealObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        });
      },
      { rootMargin: '60px 0px -32px 0px', threshold: 0.05 }
    );
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  // 4. Mobile Menu Accessibility Flow
  const closeMenu = (restoreFocus = true) => {
    if (!mobileMenu || !menuToggle) return;
    mobileMenu.classList.remove('is-open');
    mobileMenu.hidden = true;
    mobileMenu.setAttribute('aria-hidden', 'true');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open menu');
    document.body.classList.remove('menu-open');
    if (restoreFocus) menuToggle.focus();
  };

  const openMenu = () => {
    if (!mobileMenu || !menuToggle) return;
    mobileMenu.hidden = false;
    mobileMenu.setAttribute('aria-hidden', 'false');
    mobileMenu.classList.add('is-open');
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.setAttribute('aria-label', 'Close menu');
    document.body.classList.add('menu-open');
    window.requestAnimationFrame(() => mobileMenuClose?.focus());
  };

  menuToggle?.addEventListener('click', () => {
    if (menuToggle.getAttribute('aria-expanded') === 'true') closeMenu();
    else openMenu();
  });

  mobileMenuClose?.addEventListener('click', () => closeMenu());
  menuLinks.forEach((link) => link.addEventListener('click', () => closeMenu(false)));
  mobileMenu?.addEventListener('click', (event) => {
    if (event.target === mobileMenu) closeMenu();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuToggle?.getAttribute('aria-expanded') === 'true') {
      closeMenu();
    }
  });

  window.matchMedia('(min-width: 961px)').addEventListener('change', (event) => {
    if (event.matches) closeMenu(false);
  });

  // 5. Anchor Smooth Navigation & Active Section Highlighting
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const selector = link.getAttribute('href');
      if (!selector || selector === '#') return;
      const target = document.getElementById(selector.slice(1));
      if (!target) return;
      event.preventDefault();
      target.classList.add('is-visible');
      target.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-visible'));
      target.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
      window.history.replaceState(null, '', selector);
    });
  });

  const navLinks = document.querySelectorAll('.desktop-nav a[href^="#"]');
  const sections = document.querySelectorAll('main section[id]');
  if ('IntersectionObserver' in window && navLinks.length && sections.length) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((link) => {
            const isCurrent = link.getAttribute('href') === `#${entry.target.id}`;
            if (isCurrent) link.setAttribute('aria-current', 'page');
            else link.removeAttribute('aria-current');
          });
        });
      },
      { rootMargin: '-35% 0px -55% 0px', threshold: 0 }
    );
    sections.forEach((section) => sectionObserver.observe(section));
  }

  // 6. Interactive Museum Case-Study Preview
  if (hallTriggers.length) {
    const activateHall = (trigger) => {
      const title = trigger.dataset.hallTitle;
      const era = trigger.dataset.hallEra;
      const detail = trigger.dataset.hallDetail;
      const audio = trigger.dataset.hallAudio;
      hallTriggers.forEach((btn) => {
        const active = btn === trigger;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', String(active));
      });
      if (hallTitleEl && title) hallTitleEl.textContent = title;
      if (hallEraEl && era) hallEraEl.textContent = era;
      if (hallDetailEl && detail) hallDetailEl.textContent = detail;
      if (hallAudioEl && audio) hallAudioEl.textContent = audio;
    };

    hallTriggers.forEach((trigger) => {
      trigger.addEventListener('click', () => activateHall(trigger));
    });
  }

  // 7. Accessible Certificate Preview Dialog + Keyboard Carousel
  const renderCertificateByIndex = (index) => {
    if (!certificateTriggers.length || !certificateDialogImage || !certificateDialogCaption) return;
    const total = certificateTriggers.length;
    currentCertificateIndex = ((index % total) + total) % total;
    const trigger = certificateTriggers[currentCertificateIndex];
    const source = trigger.dataset.src;
    const caption = trigger.dataset.caption;
    const meta = trigger.dataset.meta;
    const verifyUrl = trigger.dataset.verify;
    if (!source || !caption) return;

    certificateDialogImage.src = source;
    certificateDialogImage.alt = `${caption} certificate preview`;
    certificateDialogCaption.textContent = caption;
    if (certificateDialogMeta) {
      certificateDialogMeta.textContent = meta || `Credential ${currentCertificateIndex + 1} of ${total}`;
    }
    if (certificateDialogVerify && verifyUrl) {
      certificateDialogVerify.href = verifyUrl;
    }
  };

  const closeCertificateDialog = () => {
    if (!certificateDialog) return;
    if (certificateDialog.open) certificateDialog.close();
    if (lastCertificateTrigger) lastCertificateTrigger.focus();
    lastCertificateTrigger = null;
  };

  const openCertificateDialog = (index, trigger) => {
    if (!certificateDialog) return;
    lastCertificateTrigger = trigger;
    renderCertificateByIndex(index);
    if (typeof certificateDialog.showModal === 'function') certificateDialog.showModal();
    else certificateDialog.setAttribute('open', '');
    certificateDialogClose?.focus();
  };

  certificateTriggers.forEach((trigger, index) => {
    trigger.addEventListener('click', () => openCertificateDialog(index, trigger));
  });

  certificateDialogPrev?.addEventListener('click', () => renderCertificateByIndex(currentCertificateIndex - 1));
  certificateDialogNext?.addEventListener('click', () => renderCertificateByIndex(currentCertificateIndex + 1));
  certificateDialogClose?.addEventListener('click', closeCertificateDialog);
  certificateDialog?.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeCertificateDialog();
  });
  certificateDialog?.addEventListener('click', (event) => {
    if (event.target === certificateDialog) closeCertificateDialog();
  });
  certificateDialog?.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      renderCertificateByIndex(currentCertificateIndex - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      renderCertificateByIndex(currentCertificateIndex + 1);
    }
  });

  // 8. Copy Direct Email Button
  if (copyEmailBtn) {
    let copyTimer = 0;
    copyEmailBtn.addEventListener('click', async () => {
      const address = copyEmailBtn.dataset.email || 'zunur007@gmail.com';
      const labelEl = copyEmailBtn.querySelector('span');
      try {
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
          await navigator.clipboard.writeText(address);
        }
        if (labelEl) labelEl.textContent = 'Copied email';
        copyEmailBtn.classList.add('is-copied');
        if (copyEmailStatus) copyEmailStatus.textContent = 'Email address copied to clipboard.';
      } catch {
        if (labelEl) labelEl.textContent = address;
      }
      window.clearTimeout(copyTimer);
      copyTimer = window.setTimeout(() => {
        if (labelEl) labelEl.textContent = 'Copy email';
        copyEmailBtn.classList.remove('is-copied');
        if (copyEmailStatus) copyEmailStatus.textContent = '';
      }, 2400);
    });
  }
});
