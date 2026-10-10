(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  // Sticky header: hide while scrolling down, reveal while scrolling up.
  const header = $('.topbar');
  let lastScrollY = window.scrollY;
  if (header) {
    window.addEventListener('scroll', () => {
      const current = window.scrollY;
      if (current > lastScrollY && current > 120) header.style.transform = 'translateY(-100%)';
      else header.style.transform = 'translateY(0)';
      lastScrollY = current;
    }, { passive: true });
  }

  // Active navigation state.
  const navLinks = $$('.topbar nav a');
  const sections = navLinks
    .map(link => $(link.getAttribute('href')))
    .filter(Boolean);

  if ('IntersectionObserver' in window && navLinks.length) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(link => link.classList.toggle(
          'active',
          link.getAttribute('href') === `#${entry.target.id}`
        ));
      });
    }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });
    sections.forEach(section => observer.observe(section));
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

  // Compact, keyboard-accessible live photo carousel.
  const photoTrack = $('#photo-track');
  const photoCards = $$('.photo-card', photoTrack || document);
  const photoCount = $('[data-photo-count]');
  const photoPrevious = $('[data-photo-prev]');
  const photoNext = $('[data-photo-next]');

  if (photoTrack && photoCards.length) {
    const currentPhotoIndex = () => {
      const trackLeft = photoTrack.getBoundingClientRect().left;
      return photoCards.reduce((closestIndex, card, index) => {
        const distance = Math.abs(card.getBoundingClientRect().left - trackLeft);
        const closestDistance = Math.abs(
          photoCards[closestIndex].getBoundingClientRect().left - trackLeft
        );
        return distance < closestDistance ? index : closestIndex;
      }, 0);
    };

    const updatePhotoGallery = () => {
      const photoIndex = currentPhotoIndex();
      if (photoCount) {
        photoCount.innerHTML = String(photoIndex + 1).padStart(2, '0') + ' <i>/</i> ' + String(photoCards.length).padStart(2, '0');
      }
      if (photoPrevious) photoPrevious.disabled = photoIndex === 0;
      if (photoNext) photoNext.disabled = photoIndex === photoCards.length - 1;
    };

    const movePhotoGallery = direction => {
      const photoIndex = currentPhotoIndex();
      const targetIndex = Math.max(0, Math.min(photoCards.length - 1, photoIndex + direction));
      const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
      const trackLeft = photoTrack.getBoundingClientRect().left;
      const cardLeft = photoCards[targetIndex].getBoundingClientRect().left;
      photoTrack.scrollTo({ left: photoTrack.scrollLeft + cardLeft - trackLeft, behavior });
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
    { day: 2, dayName: 'TUESDAY', club: 'KRUSH', time: '12:00 PM – 2:00 PM SLT', start: 12 * 60, end: 14 * 60, url: 'https://maps.secondlife.com/secondlife/Love%20is%20Love/74/9/2086' },
    { day: 3, dayName: 'WEDNESDAY', club: 'GOLDEN CROWNS CLUB', time: '10:30 PM – 12:00 AM SLT', start: 22 * 60 + 30, end: 24 * 60, url: null },
    { day: 5, dayName: 'FRIDAY', club: 'SOHO CLUB', time: '9:00 AM – 10:30 AM SLT', start: 9 * 60, end: 10 * 60 + 30, url: 'https://maps.secondlife.com/secondlife/Soho%20Island/60/192/3024' },
    { day: 6, dayName: 'SATURDAY', club: 'KRUSH', time: '8:00 PM – 10:00 PM SLT', start: 20 * 60, end: 22 * 60, url: 'https://maps.secondlife.com/secondlife/Love%20is%20Love/74/9/2086' },
    { day: 6, dayName: 'SATURDAY', club: 'THE INDECENT CLUB', time: '10:30 PM – 12:00 AM SLT', start: 22 * 60 + 30, end: 24 * 60, url: 'http://maps.secondlife.com/secondlife/Red%20Room/225/30/2010' }
  ];

  const oneTimeSets = [
    { date: '2026-10-15', dayName: 'THURSDAY', club: 'ARENA 51', time: '12:00 PM SLT', start: 12 * 60, url: null },
    { date: '2026-10-24', dayName: 'SATURDAY', club: 'SIM LAUNCH PARTY', style: 'SPECIAL EVENT / ONE-TIME SET', time: '5:00 PM SLT', start: 17 * 60, url: null }
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
    if (liveSet) {
      selected = {
        set: liveSet,
        target: slDateTimeToInstant(parts, liveSet.end),
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
