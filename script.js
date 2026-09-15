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
