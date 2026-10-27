(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  // Full-screen slide deck navigation and progress.
  const proofStrip = $('.proof-strip');
  const bookingSlide = $('#booking');
  if (proofStrip && bookingSlide) {
    const bookingActions = $('.booking-actions', bookingSlide);
    bookingSlide.insertBefore(proofStrip, bookingActions || null);
  }
  const footer = $('footer');
  if (footer && bookingSlide) bookingSlide.append(footer);
  const slides = $$('main > section');
  slides.forEach((slide, index) => {
    const label = $('.eyebrow', slide)?.textContent.trim().replace(/\s+/g, ' ') || slide.querySelector('h1,h2,h3')?.textContent.trim() || 'DJ ZRØ';
    const hud = document.createElement('div');
    hud.className = 'slide-hud';
    hud.setAttribute('aria-hidden', 'true');
    hud.innerHTML = `<span>${String(index + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}</span><b></b><i></i>`;
    $('b', hud).textContent = label;
    slide.append(hud);
  });

  const deckLinks = $$('.topbar nav a');
  const deckOverlay = document.createElement('div');
  deckOverlay.className = 'deck-wipe';
  deckOverlay.setAttribute('aria-hidden', 'true');
  deckOverlay.innerHTML = '<span class="deck-beam"></span><span class="deck-scan"></span><span class="deck-glitch"></span>';
  document.body.append(deckOverlay);

  const deckControls = document.createElement('div');
  deckControls.className = 'deck-controls';
  deckControls.innerHTML = '<button type="button" data-deck-prev aria-label="Previous slide">←</button><span data-deck-count aria-live="polite"></span><button type="button" data-deck-next aria-label="Next slide">→</button>';
  document.body.append(deckControls);
  const deckCount = $('[data-deck-count]', deckControls);
  const deckPrevious = $('[data-deck-prev]', deckControls);
  const deckNext = $('[data-deck-next]', deckControls);

  const deckRail = document.createElement('nav');
  deckRail.className = 'deck-rail';
  deckRail.setAttribute('aria-label', 'Portfolio sections');
  slides.forEach((slide, index) => {
    const label = slide.querySelector('h1,h2,h3')?.textContent.replace(/\s+/g, ' ').trim() || slide.id;
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'deck-rail-dot';
    dot.dataset.slideIndex = String(index);
    dot.dataset.label = label;
    dot.setAttribute('aria-label', `Go to ${label}`);
    dot.addEventListener('click', () => updateDeck(index, true));
    deckRail.appendChild(dot);
  });
  document.body.append(deckRail);
  const deckDots = $$('.deck-rail-dot', deckRail);

  const progressBar = document.createElement('div');
  progressBar.className = 'site-progress';
  progressBar.setAttribute('aria-hidden', 'true');
  progressBar.innerHTML = '<span></span>';
  document.body.append(progressBar);
  document.body.classList.add('slide-deck');
  const initialSlide = slides.findIndex(slide => `#${slide.id}` === window.location.hash);
  let activeSlideIndex = initialSlide >= 0 ? initialSlide : 0;
  let transitionTimer;

  const updateDeck = (nextIndex, updateHistory = false, animate = true) => {
    if (!slides.length) return;
    const boundedIndex = Math.max(0, Math.min(slides.length - 1, nextIndex));
    const previousIndex = activeSlideIndex;
    const changed = boundedIndex !== previousIndex;
    activeSlideIndex = boundedIndex;

    slides.forEach((slide, index) => {
      const isActive = index === activeSlideIndex;
      slide.classList.toggle('is-active-slide', isActive);
      slide.classList.toggle('is-before-slide', index < activeSlideIndex);
      slide.classList.toggle('is-after-slide', index > activeSlideIndex);
      slide.setAttribute('aria-hidden', String(!isActive));
      slide.inert = !isActive;
      if (isActive) slide.scrollTop = 0;
    });

    deckLinks.forEach(link => {
      const isActive = link.getAttribute('href') === `#${slides[activeSlideIndex].id}`;
      link.classList.toggle('active', isActive);
      if (isActive) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });

    if (deckCount) deckCount.textContent = `${String(activeSlideIndex + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    if (deckPrevious) deckPrevious.disabled = activeSlideIndex === 0;
    if (deckNext) deckNext.disabled = activeSlideIndex === slides.length - 1;
    deckDots.forEach((dot, index) => {
      if (index === activeSlideIndex) dot.setAttribute('aria-current', 'page');
      else dot.removeAttribute('aria-current');
    });
    progressBar.style.setProperty('--deck-progress', `${((activeSlideIndex + 1) / slides.length) * 100}%`);

    if (updateHistory && slides[activeSlideIndex].id) {
      window.history.pushState({ slide: activeSlideIndex }, '', `#${slides[activeSlideIndex].id}`);
    }
    if (changed && animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      deckOverlay.classList.remove('is-wiping');
      void deckOverlay.offsetWidth;
      deckOverlay.classList.add('is-wiping');
      window.clearTimeout(transitionTimer);
      transitionTimer = window.setTimeout(() => deckOverlay.classList.remove('is-wiping'), 820);
    }
  };

  updateDeck(activeSlideIndex, false, false);

  const slideIndexForHash = hash => slides.findIndex(slide => `#${slide.id}` === hash);
  document.addEventListener('click', event => {
    const anchor = event.target.closest('a[href^="#"]');
    if (!anchor) return;
    const targetIndex = slideIndexForHash(anchor.getAttribute('href'));
    if (targetIndex < 0) return;
    event.preventDefault();
    updateDeck(targetIndex, true);
  });
  window.addEventListener('popstate', () => {
    const targetIndex = slideIndexForHash(window.location.hash);
    updateDeck(targetIndex >= 0 ? targetIndex : 0, false);
  });
  deckPrevious?.addEventListener('click', () => updateDeck(activeSlideIndex - 1, true));
  deckNext?.addEventListener('click', () => updateDeck(activeSlideIndex + 1, true));
  let touchStartX = 0;
  let touchStartY = 0;
  document.addEventListener('touchstart', event => {
    if (event.touches.length !== 1) return;
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
  }, { passive: true });
  document.addEventListener('touchend', event => {
    if (event.changedTouches.length !== 1 || !touchStartX) return;
    const deltaX = event.changedTouches[0].clientX - touchStartX;
    const deltaY = event.changedTouches[0].clientY - touchStartY;
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest('.party-track,.photo-grid,.deck-controls,.deck-rail')) return;
    if (Math.abs(deltaX) > 64 && Math.abs(deltaX) > Math.abs(deltaY) * 1.25) {
      updateDeck(activeSlideIndex + (deltaX < 0 ? 1 : -1), true);
    }
    touchStartX = 0;
    touchStartY = 0;
  }, { passive: true });
  document.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const target = event.target;
    const isEditing = target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(target.tagName));
    if (isEditing) return;
    if (event.key === 'PageDown' || event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault();
      updateDeck(activeSlideIndex + 1, true);
    } else if (event.key === 'PageUp' || event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault();
      updateDeck(activeSlideIndex - 1, true);
    } else if (event.key === 'Home') {
      event.preventDefault();
      updateDeck(0, true);
    } else if (event.key === 'End') {
      event.preventDefault();
      updateDeck(slides.length - 1, true);
    }
  });


  // Second Life Time follows Pacific time and its daylight-saving changes.
  const sltTime = $('#slt-time');
  if (sltTime) {
    const sltFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    const updateSltClock = () => {
      sltTime.textContent = sltFormatter.format(new Date());
    };
    updateSltClock();
    window.setInterval(updateSltClock, 15000);
  }
  // Keep every set in one calendar-style grid while clearly labeling its type.
  const agendaList = $('.agenda-list');
  if (agendaList) {
    const dayNames = { MON: 'MONDAY', TUE: 'TUESDAY', WED: 'WEDNESDAY', THU: 'THURSDAY', FRI: 'FRIDAY', SAT: 'SATURDAY', SUN: 'SUNDAY' };
    const schedule = document.createElement('div');
    schedule.className = 'agenda-events-grid';
    $$('.event', agendaList).forEach(event => {
      const day = $('strong', event)?.textContent.trim();
      const frequency = $('.event-frequency', event);
      if (!dayNames[day] || !frequency) return;
      const isWeekly = frequency.classList.contains('is-weekly');
      event.classList.add(isWeekly ? 'agenda-resident' : 'agenda-one-time');
      frequency.textContent = event.classList.contains('cover-set') ? 'COVER SET' : (isWeekly ? 'RESIDENT' : 'ONE-TIME SET');
      if (!isWeekly && !$('.event-date', event)) {
        const date = document.createElement('small');
        date.className = 'event-date';
        date.textContent = 'DATE TO BE CONFIRMED';
        event.firstElementChild?.appendChild(date);
      }
      schedule.appendChild(event);
    });

    agendaList.replaceChildren(schedule);
  }

  // Let visitors audition a short excerpt from each SoundCloud set.
  const mixCards = $$('.mix-card').filter(card => $('iframe', card));
  if (mixCards.length) {
    const previewLength = 30000;
    const previewControls = mixCards.map(card => {
      let controls = $('.mix-preview-controls', card);
      if (!controls) {
        controls = document.createElement('div');
        controls.className = 'mix-preview-controls';
        const labels = document.createElement('div');
        const previewLabel = document.createElement('span');
        previewLabel.className = 'mix-preview-label';
        previewLabel.textContent = '30-SECOND PREVIEW';
        const status = document.createElement('span');
        status.className = 'mix-preview-status';
        status.textContent = 'READY TO PLAY';
        labels.append(previewLabel, status);
        const button = document.createElement('button');
        button.className = 'mix-preview-button';
        button.type = 'button';
        button.textContent = 'PLAY PREVIEW';
        button.disabled = true;
        controls.append(labels, button);
        card.insertBefore(controls, $('iframe', card));
      }
      return { frame: $('iframe', card), button: $('.mix-preview-button', controls), status: $('.mix-preview-status', controls) };
    });
    const widgetScript = document.createElement('script');
    widgetScript.src = 'https://w.soundcloud.com/player/api.js';
    widgetScript.async = true;
    widgetScript.onload = () => {
      if (!window.SC?.Widget) return;
      previewControls.forEach(({ frame, button, status }) => {
        if (!frame || !button || !status) return;
        const widget = window.SC.Widget(frame);
        let previewFinished = false;
        const setPreviewStatus = (label, buttonLabel) => {
          status.textContent = label;
          button.textContent = buttonLabel;
        };

        widget.bind(window.SC.Widget.Events.READY, () => {
          button.disabled = false;
          setPreviewStatus('READY TO PLAY', 'PLAY PREVIEW');
        });
        widget.bind(window.SC.Widget.Events.PLAY, () => {
          setPreviewStatus('PREVIEW PLAYING', 'PAUSE PREVIEW');
        });
        widget.bind(window.SC.Widget.Events.PAUSE, () => {
          if (!previewFinished) setPreviewStatus('PREVIEW PAUSED', 'RESUME PREVIEW');
        });
        widget.bind(window.SC.Widget.Events.PLAY_PROGRESS, progress => {
          if (!previewFinished && progress.currentPosition >= previewLength) {
            previewFinished = true;
            widget.pause();
            setPreviewStatus('30-SECOND PREVIEW COMPLETE', 'REPLAY PREVIEW');
          }
        });
        widget.bind(window.SC.Widget.Events.FINISH, () => {
          previewFinished = true;
          setPreviewStatus('SET FINISHED', 'REPLAY PREVIEW');
        });

        button.addEventListener('click', () => {
          if (previewFinished) {
            previewFinished = false;
            widget.seekTo(0);
            widget.play();
            return;
          }
          widget.isPaused(isPaused => isPaused ? widget.play() : widget.pause());
        });
      });
    };
    widgetScript.onerror = () => {
      previewControls.forEach(({ button, status }) => {
        if (status) status.textContent = 'SOUNDCLOUD PLAYER UNAVAILABLE';
        if (button) button.hidden = true;
      });
    };
    document.head.appendChild(widgetScript);
  }

  // Gallery lightbox.
  const lightbox = $('.lightbox');
  const lightboxImage = $('.lightbox-image');
  const closeButton = $('.lightbox-close');

  const closeLightbox = () => {
    if (!lightbox || !lightboxImage) return;
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    lightboxImage.src = '';
    document.body.style.overflow = '';
  };

  $$('.photo-button, .party-flyer-open').forEach(button => {
    button.addEventListener('click', () => {
      if (!lightbox || !lightboxImage) return;
      const image = $('img', button);
      lightboxImage.src = button.dataset.full || image?.src || '';
      lightboxImage.alt = image?.alt || 'DJ ZRØ gallery image';
      lightbox.classList.add('open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    });
  });

  closeButton?.addEventListener('click', closeLightbox);
  lightbox?.addEventListener('click', event => {
    if (event.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeLightbox();
  });

  // Compact, keyboard-accessible live photo album.
  const photoTrack = $('#photo-track');
  const photoCards = $$('.photo-card', photoTrack || document);
  const photoCount = $('[data-photo-count]');
  const photoPrevious = $('[data-photo-prev]');
  const photoNext = $('[data-photo-next]');

  const enablePointerGlow = elements => elements.forEach(element => {
    element.addEventListener('pointermove', event => {
      if (event.pointerType === 'touch') return;
      const bounds = element.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const x = (event.clientX - bounds.left) / bounds.width;
      const y = (event.clientY - bounds.top) / bounds.height;
      element.style.setProperty('--light-x', `${Math.round(x * 100)}%`);
      element.style.setProperty('--light-y', `${Math.round(y * 100)}%`);
      element.style.setProperty('--tilt-x', `${((x - .5) * 3).toFixed(2)}deg`);
      element.style.setProperty('--tilt-y', `${((.5 - y) * 2).toFixed(2)}deg`);
    });
    element.addEventListener('pointerleave', () => {
      element.style.removeProperty('--light-x');
      element.style.removeProperty('--light-y');
      element.style.removeProperty('--tilt-x');
      element.style.removeProperty('--tilt-y');
    });
  });
  enablePointerGlow($$('#agenda .agenda-events-grid > .event'));
  enablePointerGlow(photoCards);

  if (photoTrack && photoCards.length) {
    let activePhotoIndex = 0;
    let programmaticPhotoScroll = false;
    let photoScrollTimer;
    const currentPhotoIndex = () => {
      const trackRect = photoTrack.getBoundingClientRect();
      return photoCards.reduce((closestIndex, card, index) => {
        const rect = card.getBoundingClientRect();
        const distance = Math.max(0, rect.top - trackRect.top) * 2 + Math.abs(rect.left - trackRect.left);
        const closestRect = photoCards[closestIndex].getBoundingClientRect();
        const closestDistance = Math.max(0, closestRect.top - trackRect.top) * 2 + Math.abs(closestRect.left - trackRect.left);
        return distance < closestDistance ? index : closestIndex;
      }, 0);
    };

    const selectPhoto = index => {
      activePhotoIndex = Math.max(0, Math.min(photoCards.length - 1, index));
      photoCards.forEach((card, cardIndex) => card.classList.toggle('is-current-photo', cardIndex === activePhotoIndex));
      if (photoCount) {
        photoCount.innerHTML = String(activePhotoIndex + 1).padStart(2, '0') + ' <i>/</i> ' + String(photoCards.length).padStart(2, '0');
      }
      if (photoPrevious) photoPrevious.disabled = activePhotoIndex === 0;
      if (photoNext) photoNext.disabled = activePhotoIndex === photoCards.length - 1;
    };

    const updatePhotoGallery = () => {
      if (!programmaticPhotoScroll) selectPhoto(currentPhotoIndex());
    };

    const movePhotoGallery = direction => {
      const targetIndex = Math.max(0, Math.min(photoCards.length - 1, activePhotoIndex + direction));
      const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
      const trackRect = photoTrack.getBoundingClientRect();
      const cardRect = photoCards[targetIndex].getBoundingClientRect();
      selectPhoto(targetIndex);
      programmaticPhotoScroll = true;
      photoTrack.scrollTo({ top: photoTrack.scrollTop + cardRect.top - trackRect.top, behavior });
      window.clearTimeout(photoScrollTimer);
      photoScrollTimer = window.setTimeout(() => { programmaticPhotoScroll = false; }, behavior === 'smooth' ? 500 : 0);
    };

    photoPrevious?.addEventListener('click', () => movePhotoGallery(-1));
    photoNext?.addEventListener('click', () => movePhotoGallery(1));
    photoTrack.addEventListener('scroll', updatePhotoGallery, { passive: true });
    photoTrack.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        movePhotoGallery(-1);
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        movePhotoGallery(1);
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        movePhotoGallery(-1);
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        movePhotoGallery(1);
      }
    });
    window.addEventListener('resize', updatePhotoGallery, { passive: true });
    updatePhotoGallery();
  }
  // Accessible, swipeable party flyer carousel.
  const partyCarousel = $('[data-party-carousel]');
  const partyTrack = $('.party-track', partyCarousel || document);
  const partyCount = $('[data-party-count]', partyCarousel || document);
  const partyCards = $$('.party-card', partyTrack || document);
  const partyPrevious = $('[data-party-prev]', partyCarousel || document);
  const partyNext = $('[data-party-next]', partyCarousel || document);

  if (partyTrack && partyCards.length) {
    const sortPartyCardsByDate = () => {
      const parts = Object.fromEntries(
        new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit'
        }).formatToParts(new Date()).map(part => [part.type, part.value])
      );
      const today = `${parts.year}-${parts.month}-${parts.day}`;
      partyCards.sort((a, b) => {
        const aDate = a.dataset.eventDate || '9999-12-31';
        const bDate = b.dataset.eventDate || '9999-12-31';
        const aPast = aDate < today;
        const bPast = bDate < today;
        if (aPast !== bPast) return aPast ? 1 : -1;
        const dateOrder = aDate.localeCompare(bDate);
        if (dateOrder) return dateOrder;
        return Number(a.dataset.eventMinute || 0) - Number(b.dataset.eventMinute || 0);
      });
      partyCards.forEach((card, index) => {
        partyTrack.appendChild(card);
        card.setAttribute('aria-label', `${index + 1} of ${partyCards.length}`);
        const indexLabel = $('.party-index', card);
        if (indexLabel) indexLabel.textContent = String(index + 1).padStart(2, '0');
      });
    };
    sortPartyCardsByDate();
    const updatePartyCarousel = () => {
      const trackBounds = partyTrack.getBoundingClientRect();
      const cardIndex = partyCards.reduce((closestIndex, card, index) => {
        const cardBounds = card.getBoundingClientRect();
        const currentDistance = Math.abs(cardBounds.left - trackBounds.left);
        const closestDistance = Math.abs(
          partyCards[closestIndex].getBoundingClientRect().left - trackBounds.left
        );
        return currentDistance < closestDistance ? index : closestIndex;
      }, 0);

      if (partyCount) {
        partyCount.innerHTML = `${String(cardIndex + 1).padStart(2, '0')} <i>/</i> ${String(partyCards.length).padStart(2, '0')}`;
      }
      if (partyPrevious) partyPrevious.disabled = cardIndex === 0;
      if (partyNext) partyNext.disabled = cardIndex === partyCards.length - 1;
    };

    const movePartyCarousel = direction => {
      const currentIndex = partyCards.reduce((closestIndex, card, index) => {
        const distance = Math.abs(card.getBoundingClientRect().left - partyTrack.getBoundingClientRect().left);
        const closestDistance = Math.abs(
          partyCards[closestIndex].getBoundingClientRect().left - partyTrack.getBoundingClientRect().left
        );
        return distance < closestDistance ? index : closestIndex;
      }, 0);
      const targetIndex = Math.max(0, Math.min(partyCards.length - 1, currentIndex + direction));
      const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
      const trackLeft = partyTrack.getBoundingClientRect().left;
      const cardLeft = partyCards[targetIndex].getBoundingClientRect().left;
      partyTrack.scrollTo({
        left: partyTrack.scrollLeft + cardLeft - trackLeft,
        behavior
      });
    };

    partyPrevious?.addEventListener('click', () => movePartyCarousel(-1));
    partyNext?.addEventListener('click', () => movePartyCarousel(1));
    partyTrack.addEventListener('scroll', updatePartyCarousel, { passive: true });
    partyTrack.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        movePartyCarousel(-1);
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        movePartyCarousel(1);
      }
    });
    window.addEventListener('resize', updatePartyCarousel, { passive: true });
    updatePartyCarousel();
  }


  // Dynamic NEXT SET based on Second Life Time (America/Los_Angeles).
  const weeklySets = [
    { day: 1, dayName: 'MONDAY', club: 'SIRENS BEACH', style: 'WEEKLY RESIDENT SET', time: '12:00 AM – 2:00 AM SLT', start: 0, end: 2 * 60, url: null },
    { day: 2, dayName: 'TUESDAY', club: 'KRUSH', time: '12:00 PM – 2:00 PM SLT', start: 12 * 60, end: 14 * 60, url: 'https://maps.secondlife.com/secondlife/Love%20is%20Love/74/9/2086' },
    { day: 3, dayName: 'WEDNESDAY', club: 'GOLDEN CROWS', style: 'WEEKLY RESIDENT SET', time: '10:30 PM – 12:00 AM SLT', start: 22 * 60 + 30, end: 24 * 60, url: null },
    { day: 5, dayName: 'FRIDAY', club: 'SOHO CLUB', time: '9:00 AM – 10:30 AM SLT', start: 9 * 60, end: 10 * 60 + 30, url: 'https://maps.secondlife.com/secondlife/Soho%20Island/60/192/3024' },
    { day: 6, dayName: 'SATURDAY', club: 'MUSIC FOR THE SOUL', style: 'TECH HOUSE', time: '8:30 AM SLT', start: 8 * 60 + 30, url: 'https://maps.secondlife.com/secondlife/Falling%20Rose/43/35/2006' },
    { day: 6, dayName: 'SATURDAY', club: 'KRUSH', time: '8:00 PM – 10:00 PM SLT', start: 20 * 60, end: 22 * 60, url: 'https://maps.secondlife.com/secondlife/Love%20is%20Love/74/9/2086' },
    { day: 6, dayName: 'SATURDAY', club: 'THE INDECENT CLUB', time: '10:30 PM – 12:00 AM SLT', start: 22 * 60 + 30, end: 24 * 60, url: 'http://maps.secondlife.com/secondlife/Red%20Room/225/30/2010' }
  ];

  const oneTimeSets = [
    { date: '2026-10-24', dayName: 'SATURDAY', club: 'MUSIC FOR THE SOUL', style: 'TECH HOUSE · COVER SET', time: '11:30 AM SLT', start: 11 * 60 + 30, url: 'https://maps.secondlife.com/secondlife/Falling%20Rose/43/35/2006' },
    { date: '2026-10-24', dayName: 'SATURDAY', club: 'SIM LAUNCH PARTY', style: 'SPECIAL EVENT / ONE-TIME SET', time: '5:00 PM SLT', start: 17 * 60, url: null },
    { date: '2026-10-31', dayName: 'SATURDAY', club: 'DC RHYTHMS', style: 'ONE-TIME SET', time: '10:00 AM – 11:30 AM SLT', start: 10 * 60, end: 11 * 60 + 30, url: null },
    { date: '2026-11-03', dayName: 'TUESDAY', club: 'ONYX', style: 'AFRO HOUSE', time: '11:00 AM – 12:00 PM SLT', start: 11 * 60, end: 12 * 60, url: 'https://maps.secondlife.com/secondlife/Angel%20Bliss/35/80/2502' },
    { date: '2026-11-05', dayName: 'THURSDAY', club: 'WAV', style: 'ONE-TIME SET', time: '4:00 PM SLT', start: 16 * 60, url: null }
  ];

  const slTimeFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      weekday: 'short',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23'
  });
  const getSlTimeParts = date => Object.fromEntries(
    slTimeFormatter.formatToParts(date).map(part => [part.type, part.value])
  );
  const shiftSlDate = (parts, days) => {
    const date = new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day) + days));
    return {
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate()
    };
  };
  const slDateTimeToInstant = (dateParts, minutes) => {
    const dayOffset = Math.floor(minutes / 1440);
    const minuteOfDay = ((minutes % 1440) + 1440) % 1440;
    const date = shiftSlDate(dateParts, dayOffset);
    const target = {
      year: date.year,
      month: date.month,
      day: date.day,
      hour: Math.floor(minuteOfDay / 60),
      minute: minuteOfDay % 60,
      second: 0
    };
    const targetUtc = Date.UTC(target.year, target.month - 1, target.day, target.hour, target.minute);
    let instant = targetUtc;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const observed = getSlTimeParts(new Date(instant));
      const observedUtc = Date.UTC(
        Number(observed.year), Number(observed.month) - 1, Number(observed.day),
        Number(observed.hour), Number(observed.minute), Number(observed.second)
      );
      const adjustment = targetUtc - observedUtc;
      instant += adjustment;
      if (adjustment === 0) break;
    }
    return new Date(instant);
  };

  const updateNextSet = () => {
    const now = new Date();
    const parts = getSlTimeParts(now);
    const dayMap = { Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6 };
    const currentDay = dayMap[parts.weekday];
    const currentMinutes = Number(parts.hour) * 60 + Number(parts.minute);

    const liveSet = weeklySets.find(set =>
      set.day === currentDay && currentMinutes >= set.start && currentMinutes < set.end
    );
    const liveOneTimeSet = oneTimeSets.find(set => {
      if (!set.end) return false;
      const [year, month, dayNumber] = set.date.split('-').map(Number);
      const eventDate = `${year}-${String(month).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
      return eventDate === `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`
        && currentMinutes >= set.start && currentMinutes < set.end;
    });
    const weeklyCandidates = weeklySets.map(set => {
      const dayOffset = (set.day - currentDay + 7) % 7;
      let target = slDateTimeToInstant(parts, dayOffset * 1440 + set.start);
      if (target <= now) target = slDateTimeToInstant(parts, (dayOffset + 7) * 1440 + set.start);
      return { set, target, isLive: false };
    });
    const oneTimeCandidates = oneTimeSets.map(set => {
      const [year, month, dayNumber] = set.date.split('-').map(Number);
      const target = slDateTimeToInstant({ year, month, day: dayNumber }, set.start);
      return { set, target, isLive: false };
    });

    let selected;
    if (liveSet || liveOneTimeSet) {
      const activeSet = liveSet || liveOneTimeSet;
      selected = {
        set: activeSet,
        target: slDateTimeToInstant(parts, activeSet.end),
        isLive: true
      };
    } else {
      selected = [...weeklyCandidates, ...oneTimeCandidates]
        .filter(candidate => candidate.target > now)
        .sort((a, b) => a.target - b.target)[0];
    }
    if (!selected) return;

    const status = $('#nextSetStatus');
    const club = $('#nextSetClub');
    const style = $('#nextSetStyle');
    const day = $('#nextSetDay');
    const time = $('#nextSetTime');
    const countdownLabel = $('#nextSetCountdownLabel');
    const countdown = $('#nextSetCountdown');
    const teleport = $('#nextSetTeleport');
    const isLive = selected.isLive;
    if (status) status.textContent = isLive ? 'LIVE NOW' : 'UP NEXT';
    if (club) club.textContent = selected.set.club;
    if (style) style.textContent = selected.set.style || 'TECH HOUSE / BASS HOUSE';
    if (day) day.textContent = selected.set.dayName;
    if (time) time.textContent = selected.set.time;
    if (countdownLabel) countdownLabel.textContent = isLive ? 'SET ENDS IN' : 'STARTS IN';
    if (countdown) {
      let remaining = Math.max(0, Math.ceil((selected.target.getTime() - now.getTime()) / 1000));
      const days = Math.floor(remaining / 86400);
      remaining %= 86400;
      const hours = Math.floor(remaining / 3600);
      remaining %= 3600;
      const minutes = Math.floor(remaining / 60);
      const seconds = remaining % 60;
      countdown.textContent = `${String(days).padStart(2, '0')}D : ${String(hours).padStart(2, '0')}H : ${String(minutes).padStart(2, '0')}M : ${String(seconds).padStart(2, '0')}S`;
    }
    $('.next-set-card')?.classList.toggle('is-live', isLive);
    $('.next-set-section')?.classList.toggle('is-live', isLive);
    if (teleport) {
      if (selected.set.url) {
        teleport.href = selected.set.url;
        teleport.textContent = isLive ? '↗ JOIN THE SET' : '↗ TELEPORT TO CLUB';
        teleport.style.display = '';
      } else {
        teleport.removeAttribute('href');
        teleport.style.display = 'none';
      }
    }
  };

  updateNextSet();
  window.setInterval(updateNextSet, 1000);

  // Second Life teleport links for agenda events.
  const teleportLinks = {
    KRUSH: 'https://maps.secondlife.com/secondlife/Love%20is%20Love/74/9/2086',
    SOHO: 'https://maps.secondlife.com/secondlife/Soho%20Island/60/192/3024'
  };

  $$('.agenda-list .event').forEach(event => {
    if ($('.event-actions', event)) return;
    const title = ($('b', event)?.textContent || '').toUpperCase();
    const club = title.includes('KRUSH') ? 'KRUSH' : title.includes('SOHO') ? 'SOHO' : null;
    if (!club) return;

    const actions = document.createElement('div');
    actions.className = 'event-actions';
    const link = document.createElement('a');
    link.href = teleportLinks[club];
    link.className = 'teleport-button';
    link.textContent = `↗ TELEPORT TO ${club}`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    actions.appendChild(link);
    event.appendChild(actions);
  });

  // Live public Flickr photostream via Flickr JSONP feed.
  const flickrGrid = $('#flickr-grid');
  const flickrStatus = $('#flickr-status');
  if (flickrGrid && flickrStatus) {
    const feedScript = document.createElement('script');
    const showFlickrError = () => {
      if (flickrGrid.children.length) return;
      flickrStatus.textContent = 'Photos are temporarily unavailable. Open the full photostream on Flickr.';
    };
    window.renderDJZroFlickrFeed = payload => {
      const photos = Array.isArray(payload?.items) ? payload.items.slice(0, 6) : [];
      const cards = photos.map((photo, index) => {
        const imageUrl = photo.media?.m?.replace(/_m(?=\.[a-z0-9]+$)/i, '_z');
        if (!imageUrl || !photo.link) return null;
        const title = String(photo.title || 'DJ ZRØ photo').trim() || 'DJ ZRØ photo';
        const card = document.createElement('a');
        card.className = 'flickr-photo';
        card.href = photo.link;
        card.target = '_blank';
        card.rel = 'noopener noreferrer';
        card.setAttribute('aria-label', `Open ${title} on Flickr`);
        const image = document.createElement('img');
        image.src = imageUrl;
        image.alt = `${title} — DJ ZRØ on Flickr`;
        image.loading = 'lazy';
        image.decoding = 'async';
        const overlay = document.createElement('span');
        overlay.className = 'flickr-photo-overlay';
        const number = document.createElement('b');
        number.textContent = String(index + 1).padStart(2, '0');
        const caption = document.createElement('span');
        caption.textContent = title;
        const arrow = document.createElement('i');
        arrow.textContent = '↗';
        overlay.append(number, caption, arrow);
        card.append(image, overlay);
        return card;
      }).filter(Boolean);
      flickrGrid.replaceChildren(...cards);
      flickrStatus.textContent = cards.length
        ? `${String(cards.length).padStart(2, '0')} LATEST PHOTOS FROM FLICKR`
        : 'No public photos are available yet. Open the full photostream on Flickr.';
      feedScript.remove();
      delete window.renderDJZroFlickrFeed;
    };
    feedScript.src = 'https://www.flickr.com/services/feeds/photos_public.gne?id=199928464%40N02&format=json&jsoncallback=renderDJZroFlickrFeed';
    feedScript.async = true;
    feedScript.onerror = showFlickrError;
    window.setTimeout(showFlickrError, 10000);
    document.head.appendChild(feedScript);
  }
  // Discord deep link with web fallback.
  const discordButton = $('#booking a[href*="discord.com"]');
  if (discordButton) {
    discordButton.addEventListener('click', event => {
      event.preventDefault();
      window.location.href = 'discord://-/users/110883002162163712';
      window.setTimeout(() => {
        window.open('https://discord.com/users/110883002162163712', '_blank', 'noopener,noreferrer');
      }, 1200);
    });
  }

  // Press Kit download.
  const pressSection = $('#press');
  const pressButton = $('.press-head .button', pressSection || document);
  if (pressButton && pressSection) {
    const download = document.createElement('a');
    download.className = 'button';
    download.href = 'DJ_ZRO_EPK_Press_Kit_v2.pdf';
    download.download = 'DJ_ZRO_EPK_Press_Kit_v2.pdf';
    download.textContent = 'DOWNLOAD PRESS KIT';
    pressButton.replaceWith(download);
  }

  // Lightweight unique visitor badge.
  const visitorStyle = document.createElement('style');
  visitorStyle.textContent = `
    .visitor-counter{display:flex;justify-content:center;align-items:center;min-height:18px;margin:18px auto 0;opacity:.75;transition:opacity .2s}
    .visitor-counter:hover{opacity:1}
    .visitor-counter img{display:block;height:18px;width:auto}
  `;
  document.head.appendChild(visitorStyle);

  const visitorCounter = document.createElement('div');
  visitorCounter.className = 'visitor-counter';
  visitorCounter.setAttribute('aria-label', 'Unique visitors');

  const visitorBadge = document.createElement('img');
  visitorBadge.alt = 'Visitors';
  visitorBadge.src = 'https://counterapi.com/counter.svg?ns=djzro.github.io&action=view&key=unique-visitors&unique=true&label=VISITORS&style=flat&labelColor=transparent&color=transparent&noLink=true';

  visitorCounter.appendChild(visitorBadge);
  document.body.appendChild(visitorCounter);
})();
