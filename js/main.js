(function () {
  'use strict';

  /* ===== Menu burger (mobile) ===== */
  var burger = document.getElementById('header-burger');
  var nav = document.getElementById('header-nav');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var isOpen = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', !isOpen);
      burger.setAttribute('aria-label', isOpen ? 'Ouvrir le menu' : 'Fermer le menu');
      nav.classList.toggle('is-open');
      document.body.style.overflow = isOpen ? '' : 'hidden';
    });
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        burger.setAttribute('aria-expanded', 'false');
        burger.setAttribute('aria-label', 'Ouvrir le menu');
        nav.classList.remove('is-open');
        document.body.style.overflow = '';
      });
    });
  }

  /* ===== Flèche bannière : descente plus rapide ===== */
  var bannerScrollLinks = document.querySelectorAll('.page-banner__scroll[href^="#"]');
  if (bannerScrollLinks.length) {
    bannerScrollLinks.forEach(function (link) {
      link.addEventListener('click', function (e) {
        var targetId = link.getAttribute('href');
        if (!targetId || targetId === '#') return;
        var target = document.querySelector(targetId);
        if (!target) return;
        e.preventDefault();
        var headerHeight = 88;
        var targetTop = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 24;
        window.scrollTo({ top: Math.max(0, targetTop), behavior: 'auto' });
      });
    });
  }

  /* ===== Bouton retour en haut ===== */
  var scrollToTop = document.getElementById('scrollToTop');
  if (scrollToTop) {
    function toggleScrollButton() {
      if (window.pageYOffset > 400) {
        scrollToTop.classList.add('is-visible');
      } else {
        scrollToTop.classList.remove('is-visible');
      }
    }
    window.addEventListener('scroll', toggleScrollButton);
    toggleScrollButton();
    scrollToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ===== Formulaire de contact ===== */
  var contactForm = document.getElementById('contactForm');
  if (contactForm) {
    var formStatus = document.getElementById('contactFormStatus');
    function setFormStatus(type, message) {
      if (!formStatus) return;
      formStatus.className = 'contact-form__status is-visible';
      if (type) {
        formStatus.classList.add('contact-form__status--' + type);
      }
      formStatus.textContent = message || '';
    }

    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var action = contactForm.getAttribute('action') || contactForm.getAttribute('data-action') || '';
      var noBackendMsg = contactForm.getAttribute('data-no-backend-msg') || '';
      if (!action || action.indexOf('YOUR_FORM_ID') !== -1) {
        setFormStatus('error', noBackendMsg || 'Configurez l’envoi du formulaire (ex. Formspree) dans action.');
        return;
      }
      var formData = new FormData(contactForm);
      if ((formData.get('_gotcha') || '').toString().trim()) {
        return;
      }
      var submitBtn = contactForm.querySelector('button[type="submit"]');
      var originalText = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Envoi en cours…';
      }
      setFormStatus('loading', 'Envoi en cours...');
      fetch(action, {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' }
      })
        .then(function (res) {
          return res.text().then(function (text) {
            var data = {};
            if (text) {
              try {
                data = JSON.parse(text);
              } catch (err) {
                data = {};
              }
            }
            return { ok: res.ok, data: data };
          });
        })
        .then(function (result) {
          if (!result.ok) {
            var backendMessage = result.data && result.data.errors && result.data.errors[0] && result.data.errors[0].message;
            throw new Error(backendMessage || 'FORM_SUBMIT_FAILED');
          }
          setFormStatus('success', 'Message envoye avec succes. Je vous repondrai rapidement.');
          contactForm.reset();
        })
        .catch(function (err) {
          var msg = (err && err.message && err.message !== 'FORM_SUBMIT_FAILED')
            ? ('Erreur: ' + err.message)
            : 'Une erreur est survenue. Vous pouvez m ecrire directement a p.defrend@gmail.com';
          setFormStatus('error', msg);
        })
        .finally(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
          }
        });
    });
  }

  /* ===== Lightbox portfolio ===== */
  var lightbox = document.getElementById('portfolioLightbox');
  var lightboxImg = lightbox && lightbox.querySelector('.lightbox__img');
  var triggers = document.querySelectorAll('.portfolio-lightbox-trigger');
  var currentImages = [];
  var currentIndex = 0;

  function getScopedTriggers(originTrigger) {
    if (!originTrigger) return Array.from(triggers);
    var section = originTrigger.closest('.portfolio-section');
    if (!section) return Array.from(triggers);
    return Array.from(section.querySelectorAll('.portfolio-lightbox-trigger'));
  }

  function openLightbox(src, alt, originTrigger) {
    if (!lightbox || !lightboxImg) return;
    currentImages = getScopedTriggers(originTrigger).map(function (t) {
      var img = t.querySelector('img');
      var dataSrc = t.getAttribute('data-src') || '';
      var imgSrc = (img && (img.currentSrc || img.src || img.getAttribute('src'))) || '';
      return {
        src: dataSrc || imgSrc,
        fallbackSrc: imgSrc,
        alt: (img && img.getAttribute('alt')) || ''
      };
    }).filter(function (i) { return i.src || i.fallbackSrc; });
    var idx = currentImages.findIndex(function (i) {
      return i.src === src || i.fallbackSrc === src;
    });
    currentIndex = idx >= 0 ? idx : 0;
    setLightboxImage(currentImages[currentIndex]);
    lightbox.setAttribute('aria-hidden', 'false');
    lightbox.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function setLightboxImage(item) {
    if (!lightboxImg || !item) return;
    lightboxImg.onerror = function () {
      if (item.fallbackSrc && lightboxImg.src !== item.fallbackSrc) {
        lightboxImg.src = item.fallbackSrc;
        return;
      }
      lightboxImg.onerror = null;
    };
    lightboxImg.src = item.src || item.fallbackSrc || '';
    lightboxImg.alt = item.alt || 'Image portfolio';
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.setAttribute('aria-hidden', 'true');
    lightbox.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  function lightboxPrev() {
    if (currentImages.length === 0) return;
    currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length;
    setLightboxImage(currentImages[currentIndex]);
  }

  function lightboxNext() {
    if (currentImages.length === 0) return;
    currentIndex = (currentIndex + 1) % currentImages.length;
    setLightboxImage(currentImages[currentIndex]);
  }

  if (triggers.length) {
    triggers.forEach(function (trigger) {
      trigger.addEventListener('click', function () {
        var img = trigger.querySelector('img');
        var src = trigger.getAttribute('data-src') || (img && (img.currentSrc || img.src || img.getAttribute('src')));
        var alt = img && img.getAttribute('alt') || '';
        if (src) openLightbox(src, alt, trigger);
      });
    });
  }

  if (lightbox) {
    var closeBtn = lightbox.querySelector('.lightbox__close');
    var prevBtn = lightbox.querySelector('.lightbox__prev');
    var nextBtn = lightbox.querySelector('.lightbox__next');
    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
    if (prevBtn) prevBtn.addEventListener('click', lightboxPrev);
    if (nextBtn) nextBtn.addEventListener('click', lightboxNext);
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', function (e) {
      if (!lightbox.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') lightboxPrev();
      if (e.key === 'ArrowRight') lightboxNext();
    });
  }

  /* ===== Carousel image avec flèches (ex. Château de Bourgon) ===== */
  document.querySelectorAll('.portfolio-image-carousel').forEach(function (carousel) {
    var slides = carousel.querySelectorAll('.portfolio-image-carousel__slide');
    var prevBtn = carousel.querySelector('.portfolio-image-carousel__prev');
    var nextBtn = carousel.querySelector('.portfolio-image-carousel__next');
    var current = 0;
    function goTo(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (s, i) { s.classList.toggle('is-active', i === current); });
    }
    if (prevBtn) prevBtn.addEventListener('click', function () { goTo(current - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { goTo(current + 1); });
  });

  /* ===== Carousel miniatures portfolio ===== */
  document.querySelectorAll('.portfolio-thumbs-carousel').forEach(function (carousel) {
    var track = carousel.querySelector('.portfolio-section__thumbs-track');
    var prevBtn = carousel.querySelector('.portfolio-thumbs-carousel__prev');
    var nextBtn = carousel.querySelector('.portfolio-thumbs-carousel__next');
    if (!track || !prevBtn || !nextBtn) return;
    var step = 220;
    prevBtn.addEventListener('click', function () {
      track.scrollBy({ left: -step, behavior: 'smooth' });
    });
    nextBtn.addEventListener('click', function () {
      track.scrollBy({ left: step, behavior: 'smooth' });
    });
  });
})();
