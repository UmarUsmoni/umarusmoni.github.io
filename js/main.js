'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const header = document.getElementById('site-header');
  const menuToggle = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileMenuClose = document.getElementById('mobile-menu-close');
  const menuLinks = mobileMenu ? mobileMenu.querySelectorAll('a[href^="#"]') : [];
  const certificateDialog = document.getElementById('certificate-dialog');
  const certificateDialogImage = document.getElementById('certificate-dialog-image');
  const certificateDialogCaption = document.getElementById('certificate-dialog-caption');
  const certificateDialogClose = document.getElementById('certificate-dialog-close');
  const certificateTriggers = document.querySelectorAll('[data-certificate-trigger]');
  let lastCertificateTrigger = null;

  document.documentElement.classList.add('js');

  const setHeaderState = () => {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 24);
  };

  setHeaderState();
  window.addEventListener('scroll', setHeaderState, { passive: true });

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

  window.matchMedia('(min-width: 769px)').addEventListener('change', (event) => {
    if (event.matches) closeMenu(false);
  });

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const selector = link.getAttribute('href');
      if (!selector || selector === '#') return;
      const target = document.getElementById(selector.slice(1));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
      window.history.replaceState(null, '', selector);
    });
  });

  const navLinks = document.querySelectorAll('.desktop-nav a[href^="#"]');
  const sections = document.querySelectorAll('main section[id]');
  if ('IntersectionObserver' in window && navLinks.length && sections.length) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          const isCurrent = link.getAttribute('href') === `#${entry.target.id}`;
          if (isCurrent) link.setAttribute('aria-current', 'page');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });
    sections.forEach((section) => sectionObserver.observe(section));
  }

  const closeCertificateDialog = () => {
    if (!certificateDialog) return;
    if (certificateDialog.open) certificateDialog.close();
    if (lastCertificateTrigger) lastCertificateTrigger.focus();
    lastCertificateTrigger = null;
  };

  const openCertificateDialog = (trigger) => {
    if (!certificateDialog || !certificateDialogImage || !certificateDialogCaption) return;
    const source = trigger.dataset.src;
    const caption = trigger.dataset.caption;
    if (!source || !caption) return;
    lastCertificateTrigger = trigger;
    certificateDialogImage.src = source;
    certificateDialogImage.alt = `${caption} certificate preview`;
    certificateDialogCaption.textContent = caption;
    if (typeof certificateDialog.showModal === 'function') certificateDialog.showModal();
    else certificateDialog.setAttribute('open', '');
    certificateDialogClose?.focus();
  };

  certificateTriggers.forEach((trigger) => {
    trigger.addEventListener('click', () => openCertificateDialog(trigger));
  });
  certificateDialogClose?.addEventListener('click', closeCertificateDialog);
  certificateDialog?.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeCertificateDialog();
  });
  certificateDialog?.addEventListener('click', (event) => {
    if (event.target === certificateDialog) closeCertificateDialog();
  });
});
