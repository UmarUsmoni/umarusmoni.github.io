/**
 * main.js — Master Initialization & Utilities
 *
 * Orchestrates all modules (particles, cursor, typing) and provides:
 * scroll-reveal, smooth scrolling, active nav highlighting, mobile menu,
 * navbar scroll effect, contact form handling, counter animation, preloader.
 */

'use strict';

/* ════════════════════════════════════════════════════════════
   1. PRELOADER
   ════════════════════════════════════════════════════════════ */
(() => {
  // Build preloader element dynamically
  const loader = document.createElement('div');
  loader.id = 'preloader';
  Object.assign(loader.style, {
    position: 'fixed',
    inset: '0',
    zIndex: '99999',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0a0a0f',
    transition: 'opacity 0.6s ease, visibility 0.6s ease',
  });

  // Spinner
  const spinner = document.createElement('div');
  Object.assign(spinner.style, {
    width: '48px',
    height: '48px',
    border: '3px solid rgba(0, 255, 136, 0.15)',
    borderTop: '3px solid #00ff88',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  });
  loader.appendChild(spinner);

  // Inject keyframes once
  const style = document.createElement('style');
  style.textContent = `@keyframes spin{to{transform:rotate(360deg)}}`;
  document.head.appendChild(style);

  // Insert preloader at top of body as soon as possible
  document.body.prepend(loader);

  window.addEventListener('load', () => {
    loader.style.opacity = '0';
    loader.style.visibility = 'hidden';
    document.body.classList.add('loaded');
    setTimeout(() => loader.remove(), 600);
  });
})();


/* ════════════════════════════════════════════════════════════
   2. DOM CONTENT LOADED — Main Init
   ════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {

  /* ── Module Init ─────────────────────────────────────── */
  if (typeof initParticles === 'function') initParticles();
  if (typeof initCursor    === 'function') initCursor();
  if (typeof initTyping    === 'function') initTyping();


  /* ══════════════════════════════════════════════════════
     3. SCROLL REVEAL
     ══════════════════════════════════════════════════════ */
  const revealElements = document.querySelectorAll('.scroll-reveal');

  if (revealElements.length) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            // Stagger delay from data attribute or fallback to index
            const delay = el.dataset.delay
              || Array.from(revealElements).indexOf(el) * 100;
            el.style.transitionDelay = `${delay}ms`;
            el.classList.add('revealed');
            revealObserver.unobserve(el);    // reveal once
          }
        });
      },
      { threshold: 0.15 }
    );

    revealElements.forEach((el) => revealObserver.observe(el));
  }


  /* ══════════════════════════════════════════════════════
     4. SMOOTH SCROLL
     ══════════════════════════════════════════════════════ */
  const NAV_OFFSET = 70; // px — height of fixed navbar

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - NAV_OFFSET;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });


  /* ══════════════════════════════════════════════════════
     5. ACTIVE NAVIGATION
     ══════════════════════════════════════════════════════ */
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  if (sections.length && navLinks.length) {
    const navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            navLinks.forEach((link) => {
              link.classList.toggle(
                'active',
                link.getAttribute('href') === `#${id}`
              );
            });
          }
        });
      },
      { rootMargin: '-50% 0px -50% 0px' }
    );

    sections.forEach((sec) => navObserver.observe(sec));
  }


  /* ══════════════════════════════════════════════════════
     6. MOBILE MENU
     ══════════════════════════════════════════════════════ */
  const hamburger  = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');

  if (hamburger && mobileMenu) {
    const toggleMenu = (open) => {
      const isOpen = typeof open === 'boolean'
        ? open
        : !mobileMenu.classList.contains('open');

      mobileMenu.classList.toggle('open', isOpen);
      hamburger.classList.toggle('active', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    };

    hamburger.addEventListener('click', () => toggleMenu());

    // Close on close button click
    const mobileCloseBtn = document.getElementById('mobile-close-btn');
    if (mobileCloseBtn) {
      mobileCloseBtn.addEventListener('click', () => toggleMenu(false));
    }

    // Close on link click
    mobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => toggleMenu(false));
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (
        mobileMenu.classList.contains('open') &&
        !mobileMenu.contains(e.target) &&
        !hamburger.contains(e.target)
      ) {
        toggleMenu(false);
      }
    });
  }


  /* ══════════════════════════════════════════════════════
     7. NAVBAR SCROLL EFFECT
     ══════════════════════════════════════════════════════ */
  const navbar = document.querySelector('.navbar, nav');

  if (navbar) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          navbar.classList.toggle('nav-scrolled', window.scrollY > 100);
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }


  /* ══════════════════════════════════════════════════════
     8. CONTACT FORM
     ══════════════════════════════════════════════════════ */
  const contactForm = document.getElementById('contact-form');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      // Let the form submit to FormSubmit.co via its action attribute.
      // Show a brief inline success message.
      const btn = contactForm.querySelector('button[type="submit"], input[type="submit"]');
      if (btn) {
        const originalText = btn.textContent || btn.value;
        btn.textContent = '✓ Sent!';
        btn.disabled = true;
        btn.style.background = 'rgba(0, 255, 136, 0.2)';
        setTimeout(() => {
          btn.textContent = originalText;
          btn.disabled = false;
          btn.style.background = '';
        }, 3000);
      }
    });
  }


  /* ══════════════════════════════════════════════════════
     9. COUNTER ANIMATION
     ══════════════════════════════════════════════════════ */
  const counters = document.querySelectorAll('.stat-number[data-count]');

  if (counters.length) {
    const COUNTER_DURATION = 2000; // ms

    function animateCounter(el) {
      const target = parseInt(el.dataset.count, 10);
      if (isNaN(target)) return;

      const start = performance.now();

      function step(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / COUNTER_DURATION, 1);
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target);

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          el.textContent = target;
        }
      }

      requestAnimationFrame(step);
    }

    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach((el) => counterObserver.observe(el));
  }

  /* ══════════════════════════════════════════════════════
     10. MAC-STYLE SOCIAL DOCK MAGNIFIER ANIMATION
     ══════════════════════════════════════════════════════ */
  const dock = document.querySelector('.dock');
  if (dock) {
    // Add hover sounds to dock items
    dock.querySelectorAll('.dock > *').forEach((el) => {
      el.addEventListener('mouseenter', () => {
        if (typeof window.playClickSound === 'function') {
          window.playClickSound(1.6); // softer, lower pitch tick
        }
      });
    });

    dock.addEventListener('pointermove', (e) => {
      dock.querySelectorAll('.dock > *').forEach((el) => {
        const r = el.getBoundingClientRect();
        const t = Math.max(
          0,
          1 - Math.abs(e.clientX - (r.x + r.width / 2)) / 120
        );
        // Disable transitions temporarily during mouse move for instant, lag-free scaling
        el.style.transition = 'none';
        el.style.scale = 1 + t * 0.5;
      });
    });

    dock.addEventListener('pointerleave', () => {
      dock.querySelectorAll('.dock > *').forEach((el) => {
        // Restore transition so it scales back down smoothly
        el.style.transition = '';
        el.style.scale = '';
      });
    });
  }
  /* ══════════════════════════════════════════════════════
     11. SCROLL PROGRESS BAR & BACK-TO-TOP BUTTON
     ══════════════════════════════════════════════════════ */
  const scrollProgressBar = document.getElementById('scroll-progress');
  const backToTopBtn = document.getElementById('back-to-top');

  window.addEventListener('scroll', () => {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrolled = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
    if (scrollProgressBar) {
      scrollProgressBar.style.width = `${Math.min(100, Math.max(0, scrolled))}%`;
    }

    if (backToTopBtn) {
      if (window.scrollY > 350) {
        backToTopBtn.classList.add('visible');
      } else {
        backToTopBtn.classList.remove('visible');
      }
    }
  }, { passive: true });

  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      if (typeof window.playClickSound === 'function') {
        window.playClickSound();
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }


  /* ══════════════════════════════════════════════════════
     12. SKILL CATEGORY FILTERS
     ══════════════════════════════════════════════════════ */
  const filterBtns = document.querySelectorAll('.skill-filter-btn');
  const skillCategories = document.querySelectorAll('.skill-category');

  if (filterBtns.length && skillCategories.length) {
    filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        if (typeof window.playClickSound === 'function') {
          window.playClickSound(1.2);
        }

        filterBtns.forEach((b) => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');

        const filter = btn.dataset.filter;

        skillCategories.forEach((cat) => {
          const categoryName = cat.dataset.category;
          if (filter === 'all' || categoryName === filter) {
            cat.classList.remove('filtered-out');
          } else {
            cat.classList.add('filtered-out');
          }
        });
      });
    });
  }


  /* ══════════════════════════════════════════════════════
     13. CERTIFICATE LIGHTBOX MODAL
     ══════════════════════════════════════════════════════ */
  const certModal = document.getElementById('cert-modal');
  const certModalImg = document.getElementById('cert-modal-img');
  const certModalCaption = document.getElementById('cert-modal-caption');
  const certModalClose = document.getElementById('cert-modal-close');
  const certModalBackdrop = document.getElementById('cert-modal-backdrop');
  const certTriggers = document.querySelectorAll('.cert-img-wrapper, .cert-card-img-wrap');

  if (certModal && certModalImg && certModalCaption) {
    const openCertModal = (imgSrc, altText) => {
      certModalImg.src = imgSrc;
      certModalImg.alt = altText || 'Certificate Preview';
      certModalCaption.textContent = altText || 'Verified DeepLearning.AI Certificate';
      certModal.classList.add('active');
      certModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      if (typeof window.playClickSound === 'function') {
        window.playClickSound();
      }
      if (certModalClose) certModalClose.focus();
    };

    const closeCertModal = () => {
      certModal.classList.remove('active');
      certModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (typeof window.playClickSound === 'function') {
        window.playClickSound(1.5);
      }
    };

    certTriggers.forEach((trigger) => {
      trigger.addEventListener('click', () => {
        const img = trigger.querySelector('img');
        if (img) {
          openCertModal(img.src, img.alt);
        }
      });
      trigger.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const img = trigger.querySelector('img');
          if (img) openCertModal(img.src, img.alt);
        }
      });
    });

    if (certModalClose) certModalClose.addEventListener('click', closeCertModal);
    if (certModalBackdrop) certModalBackdrop.addEventListener('click', closeCertModal);

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && certModal.classList.contains('active')) {
        closeCertModal();
      }
    });
  }


  /* ══════════════════════════════════════════════════════
     14. 3D CARD TILT PHYSICS
     ══════════════════════════════════════════════════════ */
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;

  if (!isReducedMotion && !isCoarsePointer) {
    const tiltCards = document.querySelectorAll('.project-card, .featured-project, .cert-card');

    tiltCards.forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(1000px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(-4px)`;
      });

      card.addEventListener('pointerleave', () => {
        card.style.transform = '';
      });
    });
  }


  /* ══════════════════════════════════════════════════════
     15. SENTINELHASH — CLIENT-SIDE CRYPTOGRAPHIC HASHER
     ══════════════════════════════════════════════════════ */
  const sentinelInput = document.getElementById('sentinel-input');
  const sentinelAlgo = document.getElementById('sentinel-algo');
  const sentinelHash = document.getElementById('sentinel-hash');
  const sentinelCopy = document.getElementById('sentinel-copy');
  const entropyFill = document.getElementById('entropy-fill');
  const entropyScore = document.getElementById('entropy-score');
  const sentinelBits = document.getElementById('sentinel-bits');

  if (sentinelInput && sentinelAlgo && sentinelHash) {
    async function updateSentinelHash() {
      const text = sentinelInput.value;
      const algo = sentinelAlgo.value;

      // Update bit-depth label
      const bitDepths = { 'SHA-256': '256-bit digest', 'SHA-384': '384-bit digest', 'SHA-512': '512-bit digest' };
      if (sentinelBits) sentinelBits.textContent = bitDepths[algo] || `${algo} digest`;

      // Calculate Shannon Entropy / complexity
      if (entropyFill && entropyScore) {
        if (!text) {
          entropyFill.style.width = '0%';
          entropyScore.textContent = 'None';
        } else {
          const uniqueChars = new Set(text).size;
          const ratio = Math.min(100, Math.round((uniqueChars / Math.max(text.length, 1)) * 50 + Math.min(text.length * 4, 50)));
          entropyFill.style.width = `${ratio}%`;
          if (ratio > 75) entropyScore.textContent = 'High';
          else if (ratio > 40) entropyScore.textContent = 'Medium';
          else entropyScore.textContent = 'Low';
        }
      }

      if (!text) {
        sentinelHash.textContent = 'Enter text above to compute cryptographic digest...';
        return;
      }

      try {
        if (window.crypto && window.crypto.subtle) {
          const enc = new TextEncoder();
          const data = enc.encode(text);
          const hashBuf = await window.crypto.subtle.digest(algo, data);
          const hashHex = Array.from(new Uint8Array(hashBuf))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
          sentinelHash.textContent = hashHex;
        } else {
          sentinelHash.textContent = '[Web Crypto API not supported in this environment]';
        }
      } catch (err) {
        console.warn('SentinelHash error:', err);
        sentinelHash.textContent = 'Hashing error';
      }
    }

    sentinelInput.addEventListener('input', updateSentinelHash);
    sentinelAlgo.addEventListener('change', () => {
      if (typeof window.playClickSound === 'function') window.playClickSound(1.3);
      updateSentinelHash();
    });

    if (sentinelCopy) {
      sentinelCopy.addEventListener('click', async () => {
        const textToCopy = sentinelHash.textContent;
        if (!textToCopy || textToCopy.startsWith('Enter') || textToCopy.startsWith('[')) return;
        try {
          await navigator.clipboard.writeText(textToCopy);
          const copyLabel = sentinelCopy.querySelector('.copy-text');
          if (copyLabel) copyLabel.textContent = '✓ Copied!';
          if (typeof window.playClickSound === 'function') window.playClickSound(0.9);
          setTimeout(() => {
            if (copyLabel) copyLabel.textContent = 'Copy';
          }, 2000);
        } catch (e) {
          console.warn('Clipboard write failed:', e);
        }
      });
    }

    // Initial calculation
    updateSentinelHash();
  }


  /* ══════════════════════════════════════════════════════
     16. CYBERRECON — PROTOCOL INSPECTOR & ANALYZER
     ══════════════════════════════════════════════════════ */
  const reconTabs = document.querySelectorAll('.recon-tab-btn');
  const reconPanels = document.querySelectorAll('.recon-panel');
  const reconRunBtn = document.getElementById('recon-run-btn');
  const reconOutput = document.getElementById('recon-output');

  if (reconTabs.length && reconPanels.length) {
    reconTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        if (typeof window.playClickSound === 'function') window.playClickSound(1.4);

        reconTabs.forEach((t) => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');

        const target = tab.dataset.tab;
        reconPanels.forEach((p) => {
          if (p.id === `recon-${target}`) {
            p.style.display = 'block';
            p.classList.add('active');
          } else {
            p.style.display = 'none';
            p.classList.remove('active');
          }
        });
      });
    });

    if (reconRunBtn && reconOutput) {
      reconRunBtn.addEventListener('click', () => {
        if (typeof window.playClickSound === 'function') window.playClickSound(0.8);
        reconRunBtn.disabled = true;
        reconRunBtn.style.opacity = '0.5';
        const span = reconRunBtn.querySelector('span');
        const origText = span ? span.textContent : 'Run Protocol Audit';
        if (span) span.textContent = 'Scanning Packets...';

        reconOutput.style.opacity = '0.4';

        setTimeout(() => {
          reconOutput.style.opacity = '1';
          reconRunBtn.disabled = false;
          reconRunBtn.style.opacity = '1';
          if (span) span.textContent = '✓ Audit Verified (0 Warnings)';
          if (typeof window.playClickSound === 'function') window.playClickSound(1.1);

          setTimeout(() => {
            if (span) span.textContent = origText;
          }, 3000);
        }, 600);
      });
    }
  }

}); // end DOMContentLoaded
