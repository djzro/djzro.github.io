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

  $$('.photo-button').forEach(button => {
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

  const updateNextSet = () => {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      weekday: 'short',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    });
    const parts = Object.fromEntries(fmt.formatToParts(new Date()).map(p => [p.type, p.value]));
    const dayMap = { Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6 };
    const currentDay = dayMap[parts.weekday];
    const currentMinutes = Number(parts.hour) * 60 + Number(parts.minute);

    let selected = null;
    let isLive = false;
    for (const set of weeklySets) {
      if (set.day === currentDay && currentMinutes >= set.start && currentMinutes < set.end) {
        selected = set;
        isLive = true;
        break;
      }
    }

    let nextWeeklyDistance = 0;
    if (!selected) {
      const upcomingWeekly = weeklySets
        .map(set => {
          let days = (set.day - currentDay + 7) % 7;
          let distance = days * 1440 + set.start - currentMinutes;
          if (distance <= 0) distance += 7 * 1440;
          return { set, distance };
        })
        .sort((a,b) => a.distance - b.distance)[0];
      selected = upcomingWeekly.set;
      nextWeeklyDistance = upcomingWeekly.distance;
    }

    const todayYear = Number(parts.year);
    const todayMonth = Number(parts.month);
    const todayDate = Number(parts.day);
    const nextOneTime = oneTimeSets
      .map(set => {
        const [eventYear, eventMonth, eventDay] = set.date.split('-').map(Number);
        const days = (Date.UTC(eventYear, eventMonth - 1, eventDay)
          - Date.UTC(todayYear, todayMonth - 1, todayDate)) / 86400000;
        return { set, distance: days * 1440 + set.start - currentMinutes };
      })
      .filter(event => event.distance > 0)
      .sort((a,b) => a.distance - b.distance)[0];

    if (!isLive && nextOneTime && nextOneTime.distance < nextWeeklyDistance) {
      selected = nextOneTime.set;
    }

    const status = $('#nextSetStatus');
    const club = $('#nextSetClub');
    const style = $('#nextSetStyle');
    const day = $('#nextSetDay');
    const time = $('#nextSetTime');
    const teleport = $('#nextSetTeleport');
    if (status) status.textContent = isLive ? 'LIVE NOW' : 'UP NEXT';
    if (club) club.textContent = selected.club;
    if (style) style.textContent = selected.style || 'TECH HOUSE / BASS HOUSE';
    if (day) day.textContent = selected.dayName;
    if (time) time.textContent = selected.time;
    if (teleport) {
      if (selected.url) {
        teleport.href = selected.url;
        teleport.textContent = isLive ? '↗ JOIN THE SET' : '↗ TELEPORT TO CLUB';
        teleport.style.display = '';
      } else {
        teleport.removeAttribute('href');
        teleport.style.display = 'none';
      }
    }
  };

  updateNextSet();
  window.setInterval(updateNextSet, 60000);

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
