document.addEventListener('DOMContentLoaded', () => {
  // --- 1. Shared Background Music Player Logic ---
  const musicBtn = document.getElementById('music-btn');
  const bgMusic = document.getElementById('bg-music');

  if (musicBtn && bgMusic) {
    // Read state from localStorage
    const shouldPlay = localStorage.getItem('bg-music-playing') === 'true';
    const savedTime = localStorage.getItem('bg-music-time');

    // Restore music playback time position if it was previously playing
    if (savedTime && shouldPlay) {
      bgMusic.currentTime = parseFloat(savedTime);
    }

    if (shouldPlay) {
      // Browsers restrict autoplay, handle standard promise reject gracefully
      bgMusic.play()
        .then(() => {
          musicBtn.classList.add('playing');
        })
        .catch(() => {
          // Setup listener to play music on the first user interaction
          const playOnInteraction = () => {
            bgMusic.play()
              .then(() => {
                musicBtn.classList.add('playing');
              });
            document.removeEventListener('click', playOnInteraction);
          };
          document.addEventListener('click', playOnInteraction);
        });
    }

    // Save playback position dynamically as the song plays
    bgMusic.addEventListener('timeupdate', () => {
      if (!bgMusic.paused) {
        localStorage.setItem('bg-music-time', bgMusic.currentTime);
      }
    });

    // Toggle button behavior
    musicBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // prevent triggering other actions
      if (bgMusic.paused) {
        bgMusic.play();
        musicBtn.classList.add('playing');
        localStorage.setItem('bg-music-playing', 'true');
      } else {
        bgMusic.pause();
        musicBtn.classList.remove('playing');
        localStorage.setItem('bg-music-playing', 'false');
        localStorage.removeItem('bg-music-time'); // Reset position if explicitly paused
      }
    });
  }

  // --- 2. Coupons Page Stack & Redemption Logic ---
  const walletStack = document.getElementById('wallet-stack');
  const overlay = document.getElementById('wallet-overlay');
  const cards = document.querySelectorAll('.coupon-card');

  if (walletStack && cards.length > 0) {
    cards.forEach((card) => {
      const couponId = card.id;

      // Restore redeemed state from localStorage on page load
      const isRedeemed = localStorage.getItem(`${couponId}-redeemed`) === 'true';
      if (isRedeemed) {
        card.classList.add('redeemed');
        const redeemBtn = card.querySelector('.coupon-redeem-btn');
        if (redeemBtn) {
          redeemBtn.disabled = true;
          redeemBtn.textContent = 'Already Redeemed 💖';
        }
      }

      // Card click event (expand / collapse)
      card.addEventListener('click', (e) => {
        // Stop if clicking close button or redeem button
        if (e.target.closest('.coupon-close-btn') || e.target.closest('.coupon-redeem-btn')) {
          return;
        }

        if (card.classList.contains('active')) {
          closeActiveCard();
        } else {
          if (!document.querySelector('.coupon-card.active')) {
            openCard(card, e.clientX, e.clientY);
          }
        }
      });

      // Close button listener
      const closeBtn = card.querySelector('.coupon-close-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          closeActiveCard();
        });
      }

      // Redeem button listener
      const redeemBtn = card.querySelector('.coupon-redeem-btn');
      if (redeemBtn) {
        redeemBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          redeemCoupon(card);
        });
      }

      // Keyboard navigation (Enter / Space to toggle)
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (card.classList.contains('active')) {
            closeActiveCard();
          } else {
            if (!document.querySelector('.coupon-card.active')) {
              openCard(card);
            }
          }
        }
      });
    });

    // Dismiss active card on overlay clicks
    if (overlay) {
      overlay.addEventListener('click', () => {
        closeActiveCard();
      });
    }

    // Dismiss active card on ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeActiveCard();
      }
    });
  }

  // Open coupon card
  function openCard(card, x, y) {
    card.classList.add('active');
    card.setAttribute('aria-expanded', 'true');
    walletStack.classList.add('has-active');
    document.body.classList.add('has-modal-open');

    // Trigger visual sparkles pop at mouse click
    if (x !== undefined && y !== undefined) {
      createSparkles(x, y);
    } else {
      const rect = card.getBoundingClientRect();
      createSparkles(rect.left + rect.width / 2, rect.top + rect.height / 2);
    }

    const closeBtn = card.querySelector('.coupon-close-btn');
    if (closeBtn) {
      setTimeout(() => {
        closeBtn.focus();
      }, 100);
    }
  }

  // Close active coupon card
  function closeActiveCard() {
    const activeCard = document.querySelector('.coupon-card.active');
    if (activeCard) {
      activeCard.classList.remove('active');
      activeCard.setAttribute('aria-expanded', 'false');
      walletStack.classList.remove('has-active');
      document.body.classList.remove('has-modal-open');
      activeCard.focus();
    }
  }

  // Sparkle burst helper
  function createSparkles(x, y) {
    const emojis = ['✨', '💖', '🎀', '🌸', '💕', '🍭'];
    const container = document.body;

    for (let i = 0; i < 18; i++) {
      const particle = document.createElement('span');
      particle.className = 'sparkle-particle';
      particle.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;

      const angle = Math.random() * Math.PI * 2;
      const velocity = 50 + Math.random() * 110;
      const dx = Math.cos(angle) * velocity;
      const dy = Math.sin(angle) * velocity;

      particle.style.setProperty('--dx', `${dx}px`);
      particle.style.setProperty('--dy', `${dy}px`);

      container.appendChild(particle);

      setTimeout(() => {
        particle.remove();
      }, 850);
    }
  }

  // Coupon redemption trigger
  function redeemCoupon(card) {
    const isInfinite = card.id === 'coupon-3' || card.id === 'coupon-5';

    if (!isInfinite) {
      card.classList.add('redeemed');
      localStorage.setItem(`${card.id}-redeemed`, 'true');
    }

    // Trigger full screen falling confetti shower
    startConfettiShower();

    // Close the card automatically after a brief celebration delay
    setTimeout(() => {
      closeActiveCard();
      
      // If it's an infinite coupon, reset the button text so it's fresh for next time
      if (isInfinite) {
        const redeemBtn = card.querySelector('.coupon-redeem-btn');
        if (redeemBtn) {
          redeemBtn.textContent = 'Redeemed! 💖';
          setTimeout(() => {
            redeemBtn.textContent = 'Redeem Coupon 🎟️';
          }, 2000);
        }
      }
    }, 1800);
  }

  // Viewport-wide Confetti Fall
  function startConfettiShower() {
    const colors = ['#ffccd5', '#e8dbfc', '#d8f3dc', '#ffe5d9', '#fefae0', '#ffc6ff', '#e8f0fe', '#c8e6c9'];
    const numParticles = 80;

    for (let i = 0; i < numParticles; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti-particle';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

      // Scatter horizontal coordinates
      confetti.style.left = `${Math.random() * 100}vw`;

      // Set random size
      const size = 6 + Math.random() * 8;
      confetti.style.width = `${size}px`;
      confetti.style.height = `${size}px`;

      // Assign circle shapes to 50% of particles
      if (Math.random() > 0.5) {
        confetti.style.borderRadius = '50%';
      }

      // Random fall time
      const duration = 2 + Math.random() * 2.5;
      confetti.style.setProperty('--fall-duration', `${duration}s`);

      // Random spin rotation degrees
      const spin = 360 + Math.floor(Math.random() * 720);
      confetti.style.setProperty('--spin-degree', `${spin}deg`);

      document.body.appendChild(confetti);

      setTimeout(() => {
        confetti.remove();
      }, duration * 1000);
    }
  }

  // --- 3. Letter Page Balloon Popping Game Logic ---
  const balloonBtn = document.getElementById('balloon-btn');
  const letterWrapper = document.querySelector('.letter-wrapper');

  // Activate only on index.html (the letter page)
  if (letterWrapper && balloonBtn) {
    // Automatically float 10 balloons on load
    setTimeout(() => {
      spawnBalloons(10);
    }, 800);

    // Floating balloon trigger button behavior
    balloonBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      spawnBalloons(8);
    });
  }

  // Spawn balloons
  function spawnBalloons(count) {
    const colors = [
      '#ffccd5', // Blush Pink
      '#e8dbfc', // Lavender
      '#d8f3dc', // Mint
      '#ffe5d9', // Peach
      '#fefae0'  // Yellow
    ];

    for (let i = 0; i < count; i++) {
      const balloonColor = colors[Math.floor(Math.random() * colors.length)];
      
      const balloon = document.createElement('div');
      balloon.className = 'balloon';
      // Pass color to currentColor in CSS (applied to knot border and string background)
      balloon.style.color = balloonColor;
      balloon.style.backgroundColor = balloonColor;

      // Add shine highlight circle
      const shine = document.createElement('div');
      shine.className = 'balloon-shine';
      balloon.appendChild(shine);

      // Random horizontal position
      balloon.style.left = `${8 + Math.random() * 84}vw`;

      // Random duration (6s - 11s)
      const duration = 6 + Math.random() * 5;
      balloon.style.setProperty('--float-duration', `${duration}s`);

      // Horizontal sway drift amount
      const driftX = (Math.random() > 0.5 ? 1 : -1) * (40 + Math.random() * 70);
      balloon.style.setProperty('--drift-x', `${driftX}px`);

      // Drift tilt angle
      const driftAngle = (Math.random() > 0.5 ? 1 : -1) * (4 + Math.random() * 10);
      balloon.style.setProperty('--drift-angle', `${driftAngle}deg`);

      // Click event to pop
      balloon.addEventListener('click', (e) => {
        e.stopPropagation();
        popBalloon(balloon, balloonColor);
      });

      document.body.appendChild(balloon);

      // Self cleanup if balloon floats off screen
      setTimeout(() => {
        if (balloon.parentNode) {
          balloon.remove();
        }
      }, duration * 1000);
    }
  }

  // Pop balloon action
  function popBalloon(balloon, color) {
    if (balloon.classList.contains('popping')) return;
    balloon.classList.add('popping');

    // Freeze balloon in its current position
    const computedStyle = window.getComputedStyle(balloon);
    const currentTransform = computedStyle.transform;
    balloon.style.transform = currentTransform;
    balloon.style.animation = 'none';

    // Force browser reflow to apply styles immediately
    void balloon.offsetHeight;

    // Apply scale-up and fade-out transition inline
    balloon.style.transition = 'transform 0.15s cubic-bezier(0.1, 0.8, 0.3, 1), opacity 0.15s cubic-bezier(0.1, 0.8, 0.3, 1)';
    let targetTransform = 'scale(1.35)';
    if (currentTransform && currentTransform !== 'none') {
      targetTransform = `${currentTransform} scale(1.35)`;
    }
    balloon.style.transform = targetTransform;
    balloon.style.opacity = '0';

    const rect = balloon.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    // Trigger visual pop particles
    spawnPopFragments(x, y, color);

    setTimeout(() => {
      if (balloon.parentNode) {
        balloon.remove();
      }
    }, 150);
  }

  // Balloon pop explosion particles helper
  function spawnPopFragments(x, y, color) {
    const numFragments = 10;

    for (let i = 0; i < numFragments; i++) {
      const fragment = document.createElement('div');
      fragment.className = 'pop-fragment';
      fragment.style.backgroundColor = color;
      fragment.style.left = `${x}px`;
      fragment.style.top = `${y}px`;

      const angle = Math.random() * Math.PI * 2;
      const distance = 40 + Math.random() * 60;
      const dfx = Math.cos(angle) * distance;
      const dfy = Math.sin(angle) * distance;

      fragment.style.setProperty('--dfx', `${dfx}px`);
      fragment.style.setProperty('--dfy', `${dfy}px`);

      document.body.appendChild(fragment);

      setTimeout(() => {
        fragment.remove();
      }, 450);
    }
  }
});
