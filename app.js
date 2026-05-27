document.addEventListener('DOMContentLoaded', () => {
  const mainCanvas = document.getElementById('mainCanvas');
  const stickyHeader = document.getElementById('stickyHeader');

  // 1. Lenis Smooth Scroll Integration on Custom Element
  let lenis;
  if (mainCanvas) {
    lenis = new Lenis({
      wrapper: mainCanvas,
      content: document.getElementById('scrollContent'),
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // exponential ease
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      smoothTouch: false, // keep native touch scrolling on mobile devices
      touchMultiplier: 1.5,
      infinite: false,
    });

    // Synchronize ScrollTrigger with Lenis
    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    // Set ScrollTrigger default scroller to mainCanvas
    ScrollTrigger.defaults({
      scroller: mainCanvas
    });

    // --- Scroll Navigation & Transition Logic ---

    // Dynamic Sticky Header Styling Transition (background/border/shadow & opacity)
    lenis.on('scroll', (e) => {
      const scrollTop = e.scroll;
      const H_landing = mainCanvas.clientHeight - 62;

      // Transparency: 0 initially, 100 once scrolling starts
      if (scrollTop > 0) {
        stickyHeader.classList.remove('opacity-0', 'pointer-events-none');
        stickyHeader.classList.add('opacity-100');
      } else {
        stickyHeader.classList.remove('opacity-100');
        stickyHeader.classList.add('opacity-0', 'pointer-events-none');
      }

      if (scrollTop >= H_landing) {
        // Stuck state: white background, shadow, border
        stickyHeader.classList.add('bg-white', 'border-[#EAE3D8]', 'shadow-sm');
        stickyHeader.classList.remove('bg-transparent', 'border-transparent', 'shadow-none');
      } else {
        // Inline state: transparent, no border, no shadow
        stickyHeader.classList.remove('bg-white', 'border-[#EAE3D8]', 'shadow-sm');
        stickyHeader.classList.add('bg-transparent', 'border-transparent', 'shadow-none');
      }
    });

    // Anchor link clicks smooth scroll using Lenis
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href');
        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          lenis.scrollTo(targetEl);
        }
      });
    });

    // Scroll arrow bouncing/wiggling animation loop
    const scrollArrow = document.getElementById('scrollArrow');
    if (scrollArrow) {
      // Bouncing wiggle animation loop
      gsap.timeline({ repeat: -1 })
        .to(scrollArrow, { y: 12, duration: 0.6, ease: "power2.in" })
        .to(scrollArrow, { y: 0, duration: 0.4, ease: "bounce.out" })
        .to(scrollArrow, { y: 0, duration: 0.5 }); // pause at top
    }
  }

  // 1b. Laptop Scroll Entrance Animation (ScrollTrigger linked to #landing)
  const laptopScrollContainer = document.getElementById('laptopScrollContainer');

  if (laptopScrollContainer && mainCanvas) {
    gsap.fromTo(laptopScrollContainer,
      { x: "-100vw", rotationX: -40 },
      {
        x: "0vw",
        rotationX: 0,
        transformPerspective: 1000,
        scrollTrigger: {
          trigger: "#landing",
          start: "top top",
          end: "bottom top",
          scrub: 1,
          scroller: mainCanvas
        }
      }
    );
  }

  // 1c. Laptop Scroll to About Section & Teleportation to Pricing Animation
  const heroLaptopWrapper = document.getElementById('heroLaptopWrapper');
  const aboutLaptopPlaceholder = document.getElementById('aboutLaptopPlaceholder');
  const pricingLaptopPlaceholder = document.getElementById('pricingLaptopPlaceholder');
  const aboutPortal = document.getElementById('aboutPortal');
  const pricingPortal = document.getElementById('pricingPortal');

  if (laptopScrollContainer && heroLaptopWrapper && aboutLaptopPlaceholder && pricingLaptopPlaceholder && aboutPortal && pricingPortal && mainCanvas) {
    const getCenterCoords = (elem) => {
      const box = elem.getBoundingClientRect();
      const scrollOffset = (typeof lenis !== 'undefined' && lenis) ? lenis.scroll : mainCanvas.scrollTop;
      return {
        top: box.top + box.height / 2 + scrollOffset,
        left: box.left + box.width / 2 + mainCanvas.scrollLeft
      };
    };

    let deltaX_about = 0;
    let deltaY_about = 0;
    let deltaX_pricing = 0;
    let deltaY_pricing = 0;

    const calculateOffsets = () => {
      const center_hero = getCenterCoords(heroLaptopWrapper);
      const center_about = getCenterCoords(aboutLaptopPlaceholder);
      const center_pricing = getCenterCoords(pricingLaptopPlaceholder);

      deltaX_about = center_about.left - center_hero.left;
      deltaY_about = center_about.top - center_hero.top;

      deltaX_pricing = center_pricing.left - center_hero.left;
      deltaY_pricing = center_pricing.top - center_hero.top;
    };

    // Calculate initial offsets
    calculateOffsets();

    // Recalculate offsets on window load, resize or when scroll triggers refresh
    window.addEventListener('load', calculateOffsets);
    window.addEventListener('resize', calculateOffsets);
    ScrollTrigger.addEventListener('refreshInit', calculateOffsets);

    // Keep references to active custom teleport/glitch/landing tweens so they can be canceled
    // without killing ScrollTrigger 1's scrubbed timeline tween on laptopScrollContainer.
    let teleportTween = null;
    let glitchTween = null;
    let shakeTween = null;
    let impactTween = null;

    const killTeleportTweens = () => {
      if (teleportTween) {
        teleportTween.kill();
        teleportTween = null;
      }
      if (glitchTween) {
        glitchTween.kill();
        glitchTween = null;
      }
      if (shakeTween) {
        shakeTween.kill();
        shakeTween = null;
      }
      if (impactTween) {
        impactTween.kill();
        impactTween = null;
      }
    };

    // 1. Initial translation to About section (Scrubbed)
    gsap.fromTo(laptopScrollContainer,
      {
        x: 0,
        y: 0,
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
        scale: 1,
        opacity: 1
      },
      {
        x: () => deltaX_about,
        y: () => deltaY_about,
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
        scale: 1,
        opacity: 1,
        scrollTrigger: {
          trigger: "#hero",
          start: "50% top",
          end: "bottom top",
          scrub: 1,
          scroller: mainCanvas,
          invalidateOnRefresh: true
        }
      }
    );

    // Glitch Helper Function
    const triggerGlitch = (element, callback) => {
      killTeleportTweens();
      glitchTween = gsap.timeline({ onComplete: callback });
      // Shake it rapidly
      for (let i = 0; i < 15; i++) {
        glitchTween.to(element, {
          x: () => deltaX_about + (Math.random() - 0.5) * 15,
          y: () => deltaY_about + (Math.random() - 0.5) * 15,
          rotationZ: (Math.random() - 0.5) * 6,
          duration: 0.025,
          ease: "none"
        });
      }
      // Reset position
      glitchTween.to(element, {
        x: () => deltaX_about,
        y: () => deltaY_about,
        rotationZ: 0,
        duration: 0.02
      });
    };

    // 2. Teleportation Trigger at 25% of About (glitch, disappear/portal suck-in)
    ScrollTrigger.create({
      trigger: "#about",
      start: "25% top",
      scroller: mainCanvas,
      onEnter: () => {
        killTeleportTweens();
        gsap.killTweensOf(aboutPortal);

        // Open the teleportation portal (black violet circle background)
        gsap.to(aboutPortal, {
          scale: 1.1,
          opacity: 0.9,
          duration: 0.2,
          ease: "back.out(1.5)"
        });

        // Trigger glitch vibration, then disappear the laptop and close portal
        triggerGlitch(laptopScrollContainer, () => {
          teleportTween = gsap.to(laptopScrollContainer, {
            scale: 0,
            opacity: 0,
            duration: 0.25,
            ease: "power2.in"
          });
          gsap.to(aboutPortal, {
            scale: 0,
            opacity: 0,
            duration: 0.25,
            delay: 0.1,
            ease: "power2.in"
          });
        });
      },
      onLeaveBack: () => {
        killTeleportTweens();
        gsap.killTweensOf(aboutPortal);

        // Place the laptop back at About coordinates (scale 0, ready to emerge)
        gsap.set(laptopScrollContainer, {
          x: () => deltaX_about,
          y: () => deltaY_about,
          scale: 0,
          opacity: 0,
          rotationX: 0,
          rotationY: 0,
          rotationZ: 0
        });

        // Open portal, emerge laptop, close portal
        gsap.to(aboutPortal, {
          scale: 1.1,
          opacity: 0.9,
          duration: 0.2,
          ease: "back.out(1.5)",
          onComplete: () => {
            teleportTween = gsap.to(laptopScrollContainer, {
              scale: 1,
              opacity: 1,
              duration: 0.3,
              ease: "back.out(1.2)"
            });
            gsap.to(aboutPortal, {
              scale: 0,
              opacity: 0,
              duration: 0.25,
              delay: 0.15,
              ease: "power2.in"
            });
          }
        });
      }
    });

    // 3. Teleportation Trigger at 2% of Pricing (portal emerge with gravity shake)
    ScrollTrigger.create({
      trigger: "#pricing",
      start: "2% top", // starts when 2% of the pricing section has scrolled past the top
      scroller: mainCanvas,
      onEnter: () => {
        killTeleportTweens();
        gsap.killTweensOf(pricingPortal);

        // Place laptop high above Pricing coordinates instantly, prepared for gravity drop
        gsap.set(laptopScrollContainer, {
          x: () => deltaX_pricing,
          y: () => deltaY_pricing - 150,
          scale: 0.5,
          opacity: 0,
          rotationX: 0,
          rotationY: 0,
          rotationZ: -15
        });

        // Open portal
        gsap.to(pricingPortal, {
          scale: 1.1,
          opacity: 0.9,
          duration: 0.25,
          ease: "back.out(1.5)",
          onComplete: () => {
            // Drop laptop down like gravity
            teleportTween = gsap.to(laptopScrollContainer, {
              y: () => deltaY_pricing,
              scale: 1,
              opacity: 1,
              rotationZ: 0,
              duration: 0.35,
              ease: "power2.in", // accelerates like gravity
              onComplete: () => {
                // Gravity landing shake effect (vertical squash, stretch, and settle)
                shakeTween = gsap.timeline();
                shakeTween.to(laptopScrollContainer, {
                  y: () => deltaY_pricing + 12, // squish down slightly
                  scaleY: 0.88,
                  duration: 0.05,
                  ease: "power1.out"
                })
                  .to(laptopScrollContainer, {
                    y: () => deltaY_pricing - 15, // bounce up
                    scaleY: 1.05,
                    duration: 0.08,
                    ease: "power1.inOut"
                  })
                  .to(laptopScrollContainer, {
                    y: () => deltaY_pricing + 8,
                    duration: 0.06,
                    ease: "power1.inOut"
                  })
                  .to(laptopScrollContainer, {
                    y: () => deltaY_pricing - 4,
                    duration: 0.05,
                    ease: "power1.inOut"
                  })
                  .to(laptopScrollContainer, {
                    y: () => deltaY_pricing,
                    scaleY: 1,
                    duration: 0.04,
                    ease: "power1.out"
                  });

                // Horizontal impact vibration
                impactTween = gsap.fromTo(laptopScrollContainer,
                  { x: () => deltaX_pricing - 10 },
                  {
                    x: () => deltaX_pricing + 10,
                    duration: 0.03,
                    repeat: 8,
                    yoyo: true,
                    ease: "none",
                    onComplete: () => {
                      gsap.set(laptopScrollContainer, { x: () => deltaX_pricing });
                    }
                  }
                );

                // Close portal
                gsap.to(pricingPortal, {
                  scale: 0,
                  opacity: 0,
                  duration: 0.3,
                  delay: 0.1,
                  ease: "power2.in"
                });
              }
            });
          }
        });
      },
      onLeaveBack: () => {
        killTeleportTweens();
        gsap.killTweensOf(pricingPortal);

        // Open portal in pricing, suck laptop up and in, close portal
        gsap.to(pricingPortal, {
          scale: 1.1,
          opacity: 0.9,
          duration: 0.2,
          ease: "back.out(1.5)"
        });

        teleportTween = gsap.to(laptopScrollContainer, {
          y: () => deltaY_pricing - 120, // move up as if pulled up
          scale: 0,
          opacity: 0,
          duration: 0.3,
          ease: "power2.in",
          onComplete: () => {
            gsap.to(pricingPortal, {
              scale: 0,
              opacity: 0,
              duration: 0.2,
              ease: "power2.in"
            });
          }
        });
      }
    });
  }

  // 2. Active Section Highlight using IntersectionObserver
  const sections = document.querySelectorAll('section');
  const navLinks = document.querySelectorAll('#stickyHeader nav a.nav-link');

  const observerOptions = {
    root: mainCanvas,
    rootMargin: '-50px 0px -50px 0px',
    threshold: 0.3
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');

        // Remove underline from all links
        navLinks.forEach(link => {
          link.classList.remove('wavy-underline', 'font-bold');
        });

        // Find corresponding link and add active class
        // Map 'hero' (laptop section) to 'landing' (Home link)
        let targetId = id;
        if (id === 'hero') {
          targetId = 'landing';
        }

        navLinks.forEach(link => {
          const href = link.getAttribute('href');
          if (href === `#${targetId}`) {
            link.classList.add('wavy-underline', 'font-bold');
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach(section => observer.observe(section));

  // 3. Premium Interactive 3D Tilt Effect on Pineapple Laptops
  const tiltCards = document.querySelectorAll('.tilt-card');

  tiltCards.forEach(card => {
    const parent = card.parentElement;

    parent.addEventListener('mousemove', (e) => {
      const rect = parent.getBoundingClientRect();
      const x = e.clientX - rect.left; // x position within the element
      const y = e.clientY - rect.top;  // y position within the element

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Calculate rotation angles (max 15 degrees)
      const rotateX = ((centerY - y) / centerY) * 15;
      const rotateY = ((x - centerX) / centerX) * 15;

      // Smoothly tilt using GSAP for maximum performance and anti-jitter
      gsap.to(card, {
        rotationX: rotateX,
        rotationY: rotateY,
        scale: 1.05,
        transformPerspective: 1000,
        duration: 0.4,
        ease: "power2.out",
        overwrite: "auto"
      });

      const img = card.querySelector('img');
      if (img) {
        // Shift drop shadow slightly opposite to rotation direction for 3D realism
        const shadowX = -rotateY * 0.8;
        const shadowY = rotateX * 0.8;
        gsap.to(img, {
          filter: `drop-shadow(${shadowX}px ${shadowY}px 25px rgba(0,0,0,0.25))`,
          duration: 0.4,
          ease: "power2.out",
          overwrite: "auto"
        });
      }
    });

    parent.addEventListener('mouseleave', () => {
      // Reset position smoothly
      gsap.to(card, {
        rotationX: 0,
        rotationY: 0,
        scale: 1,
        duration: 0.6,
        ease: "power2.out",
        overwrite: "auto"
      });
      const img = card.querySelector('img');
      if (img) {
        gsap.to(img, {
          filter: 'drop-shadow(0px 10px 15px rgba(0,0,0,0.15))',
          duration: 0.6,
          ease: "power2.out",
          overwrite: "auto"
        });
      }
    });
  });

  // 4. Contact Form Handling with Typewriter Confirmation Feedback
  const contactForm = document.getElementById('contactForm');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // Get the submit button and preserve its original contents
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalHTML = submitBtn.innerHTML;

      // Change button state
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>SENDING...</span>';

      // Send email via EmailJS
      const countryCodeVal = document.getElementById('countryCode') ? document.getElementById('countryCode').value : '';
      const phoneVal = document.getElementById('phone').value;
      const fullPhone = countryCodeVal + ' ' + phoneVal;
      emailjs.send("service_4xr9aps", "template_b59w5hr", {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: fullPhone,
        phone_number: fullPhone,
        phoneNumber: fullPhone,
        contact: fullPhone,
        contact_number: fullPhone,
        subject: document.getElementById('subject').value,
        message: document.getElementById('message').value
      })
        .then(() => {
          // Show confirmation screen/message inside the form
          const formParent = contactForm.parentElement;

          // Smoothly fade out form
          contactForm.style.transition = 'opacity 0.3s ease';
          contactForm.style.opacity = '0';

          setTimeout(() => {
            contactForm.classList.add('hidden');

            // Create the success confirmation element
            const successDiv = document.createElement('div');
            successDiv.className = 'flex flex-col items-center justify-center text-center py-12 space-y-4 font-typewriter';
            successDiv.innerHTML = `
            <div class="w-16 h-16 bg-olive-green/10 border border-olive-green rounded-full flex items-center justify-center text-olive-green animate-bounce">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <h5 class="text-olive-green text-lg font-bold uppercase tracking-wider">Message Received!</h5>
            <p id="typewriterText" class="text-custom-dark text-sm max-w-xs leading-relaxed"></p>
            <button id="resetFormBtn" class="mt-8 bg-black text-white px-5 py-2.5 rounded-[8px] font-montserrat italic font-black text-xs tracking-wider uppercase hover:bg-neutral-800 transition-colors shadow-sm">
              SEND ANOTHER MESSAGE
            </button>
          `;

            formParent.appendChild(successDiv);

            // Typewriter effect for success message
            const messageText = "Thank you! Your message has been sent successfully. Our team in Kolkata will get back to you within 24 hours.";
            const textEl = document.getElementById('typewriterText');
            let i = 0;

            function typeWriter() {
              if (i < messageText.length) {
                textEl.textContent += messageText.charAt(i);
                i++;
                setTimeout(typeWriter, 30);
              }
            }
            typeWriter();

            // Reset form functionality
            const resetBtn = document.getElementById('resetFormBtn');
            resetBtn.addEventListener('click', () => {
              successDiv.remove();
              contactForm.reset();
              contactForm.classList.remove('hidden');
              contactForm.style.opacity = '1';
              submitBtn.disabled = false;
              submitBtn.innerHTML = originalHTML;
            });

          }, 300);
        })
        .catch((error) => {
          console.error("EmailJS Failed to send message:", error);
          alert("Failed to send message. Please verify your internet connection, or email us directly at hello@gigapinex.ai.");
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalHTML;
        });
    });
  }

  // 5. Book a Call Modal Handler
  const bookCallBtns = document.querySelectorAll('.book-call-trigger');
  const callModal = document.getElementById('callModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const modalPhone = document.getElementById('modalPhone');
  const modalSubmitBtn = document.getElementById('modalSubmitBtn');
  const modalMainContent = document.getElementById('modalMainContent');
  const modalSuccessContent = document.getElementById('modalSuccessContent');

  if (bookCallBtns.length > 0 && callModal && closeModalBtn) {
    const openModal = () => {
      // Reset modal contents
      modalMainContent.classList.remove('hidden');
      modalSuccessContent.classList.add('hidden');
      modalPhone.value = '';
      modalSubmitBtn.disabled = false;
      modalSubmitBtn.innerHTML = '<span>CONFIRM & CONNECT &rarr;</span>';

      callModal.classList.remove('hidden');
      // Trigger reflow for transition
      void callModal.offsetWidth;
      callModal.classList.remove('opacity-0');
      callModal.classList.add('opacity-100');

      const modalBox = callModal.querySelector('.transform');
      if (modalBox) {
        modalBox.classList.remove('scale-95');
        modalBox.classList.add('scale-100');
      }
    };

    const closeModal = () => {
      callModal.classList.remove('opacity-100');
      callModal.classList.add('opacity-0');

      const modalBox = callModal.querySelector('.transform');
      if (modalBox) {
        modalBox.classList.remove('scale-100');
        modalBox.classList.add('scale-95');
      }

      // Wait for animation to finish
      setTimeout(() => {
        callModal.classList.add('hidden');
      }, 300);
    };

    bookCallBtns.forEach(btn => btn.addEventListener('click', openModal));
    closeModalBtn.addEventListener('click', closeModal);

    // Close modal on clicking overlay background
    callModal.addEventListener('click', (e) => {
      if (e.target === callModal) {
        closeModal();
      }
    });

    // Form submission inside modal
    modalSubmitBtn.addEventListener('click', (e) => {
      const countryCode = document.getElementById('modalCountryCode') ? document.getElementById('modalCountryCode').value : '';
      const phoneNumber = modalPhone.value.trim();

      // Validate 10-digit number
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(phoneNumber)) {
        alert("Please enter a valid 10-digit phone number.");
        return;
      }

      // Update button state to loading
      modalSubmitBtn.disabled = true;
      modalSubmitBtn.innerHTML = '<span>CONNECTING...</span>';

      // Short delay for UI feel
      setTimeout(() => {
        // Show success screen in modal
        modalMainContent.classList.add('hidden');
        modalSuccessContent.classList.remove('hidden');

        // Open WhatsApp link to send the message to 8617284273
        const whatsappNumber = "918617284273"; // India country code prefix
        const fullPhoneNumber = countryCode + ' ' + phoneNumber;
        const messageText = `Hi, I want to book a call. My phone number is: ${fullPhoneNumber}`;
        const whatsappUrl = `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${encodeURIComponent(messageText)}`;

        // Open WhatsApp in a new window/tab
        window.open(whatsappUrl, '_blank');

        // Close modal after 3 seconds
        setTimeout(() => {
          closeModal();
        }, 3000);

      }, 800);
    });
  }

  // 6. Restrict phone inputs to 10 digits
  const restrictTo10Digits = (inputEl) => {
    inputEl.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '');
      if (e.target.value.length > 10) {
        e.target.value = e.target.value.slice(0, 10);
      }
    });
  };

  const phoneInput = document.getElementById('phone');
  const modalPhoneInput = document.getElementById('modalPhone');
  if (phoneInput) restrictTo10Digits(phoneInput);
  if (modalPhoneInput) restrictTo10Digits(modalPhoneInput);

  // 7. Custom Golden Pixel-Art Pyramid Cursor & Lightning Particle System
  const initCustomCursor = () => {
    // Check if pointer hover is supported (mouse device)
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      return;
    }

    // Build the SVG string for a yellow ring with a dot inside
    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100%" height="100%">
        <!-- Outer Ring -->
        <circle cx="12" cy="12" r="8" stroke="#ffcc00" stroke-width="2" fill="none" />
        <!-- Center Dot -->
        <circle cx="12" cy="12" r="2" fill="#ffcc00" />
      </svg>
    `;

    // Create the custom cursor element
    const cursorEl = document.createElement('div');
    cursorEl.id = 'custom-cursor';
    cursorEl.innerHTML = svgContent;
    document.body.appendChild(cursorEl);

    // Add active class to body to hide native cursor
    document.body.classList.add('custom-cursor-active');

    // Particle svgs for lightning bolts and sparks
    const lightningGrid = [
      ". . Y Y .",
      ". Y Y . .",
      "Y Y Y Y .",
      ". . Y Y .",
      ". Y Y . .",
      "Y Y . . .",
      "Y . . . ."
    ];

    let lightningSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 5 7" width="100%" height="100%" style="shape-rendering: crispEdges;">`;
    for (let y = 0; y < lightningGrid.length; y++) {
      const row = lightningGrid[y].split(' ');
      for (let x = 0; x < row.length; x++) {
        if (row[x] === 'Y') {
          lightningSvg += `<rect x="${x}" y="${y}" width="1" height="1" fill="#ffcc00" />`;
        }
      }
    }
    lightningSvg += `</svg>`;

    // Keep track of cursor coordinates
    let mouseX = 0;
    let mouseY = 0;

    // Use GSAP's quickSetter for maximum performance and GPU acceleration
    const setCursorX = gsap.quickSetter(cursorEl, "x", "px");
    const setCursorY = gsap.quickSetter(cursorEl, "y", "px");

    // Track if hover state is active
    let isHoveringComponent = false;
    let lastMoveEmitTime = 0;

    // Create and animate a single particle
    const createSpark = (x, y) => {
      const spark = document.createElement('div');
      spark.className = 'cursor-particle';

      const rand = Math.random();
      let size = 6;
      if (rand < 0.25) {
        // Lightning bolt shape
        spark.innerHTML = lightningSvg;
        size = 12 + Math.random() * 6;
      } else if (rand < 0.6) {
        // Yellow pixel square
        spark.innerHTML = `<svg viewBox="0 0 2 2" width="100%" height="100%" style="shape-rendering: crispEdges;"><rect x="0" y="0" width="2" height="2" fill="#ffd700" /></svg>`;
        size = 4 + Math.random() * 5;
      } else {
        // White pixel square
        spark.innerHTML = `<svg viewBox="0 0 2 2" width="100%" height="100%" style="shape-rendering: crispEdges;"><rect x="0" y="0" width="2" height="2" fill="#ffffff" /></svg>`;
        size = 4 + Math.random() * 4;
      }

      spark.style.width = size + 'px';
      spark.style.height = size + 'px';

      // Set initial random offset from cursor center
      const offsetAngle = Math.random() * Math.PI * 2;
      const offsetDist = Math.random() * 12; // spawn in tight radius
      const startX = x + Math.cos(offsetAngle) * offsetDist;
      const startY = y + Math.sin(offsetAngle) * offsetDist;

      gsap.set(spark, {
        x: startX,
        y: startY,
        xPercent: -50,
        yPercent: -50,
        rotation: Math.random() * 360,
        opacity: 1,
        scale: 0.4 + Math.random() * 0.6
      });

      document.body.appendChild(spark);

      // Move particle outwards in random direction
      const angle = Math.random() * Math.PI * 2;
      const distance = 25 + Math.random() * 50; // spread radius
      const targetX = startX + Math.cos(angle) * distance;
      const targetY = startY + Math.sin(angle) * distance;

      gsap.to(spark, {
        x: targetX,
        y: targetY,
        rotation: "+=" + (180 + Math.random() * 180) * (Math.random() < 0.5 ? 1 : -1),
        scale: 0,
        opacity: 0,
        duration: 0.35 + Math.random() * 0.35,
        ease: "power2.out",
        onComplete: () => spark.remove()
      });
    };

    // Burst of multiple sparks on first entry
    const spawnSparkBurst = (count) => {
      for (let i = 0; i < count; i++) {
        createSpark(mouseX, mouseY);
      }
    };

    // Mouse movement event listener
    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      setCursorX(mouseX);
      setCursorY(mouseY);

      if (isHoveringComponent) {
        const now = Date.now();
        // Emit particle on move every 50ms for smooth trail
        if (now - lastMoveEmitTime > 50) {
          createSpark(mouseX, mouseY);
          lastMoveEmitTime = now;
        }
      }
    });

    // Detect hovers using event delegation
    const interactiveSelectors = 'a, button, select, input, textarea, [role="button"], .pricing-card, .tilt-card, #scrollArrow';

    document.body.addEventListener('mouseover', (e) => {
      const target = e.target.closest(interactiveSelectors);
      if (target) {
        if (!isHoveringComponent) {
          isHoveringComponent = true;
          spawnSparkBurst(3 + Math.floor(Math.random() * 3));
          if (cursorEl) {
            cursorEl.style.display = 'none';
          }
        }
      }
    });

    document.body.addEventListener('mouseout', (e) => {
      const target = e.target.closest(interactiveSelectors);
      if (target) {
        const relatedTarget = e.relatedTarget ? e.relatedTarget.closest(interactiveSelectors) : null;
        if (!relatedTarget) {
          isHoveringComponent = false;
          if (cursorEl) {
            cursorEl.style.display = 'block';
          }
        }
      }
    });

    // Steady background spark emission while hovering (stationary mouse)
    setInterval(() => {
      if (isHoveringComponent) {
        createSpark(mouseX, mouseY);
      }
    }, 150);
  };

  // Run initialization
  initCustomCursor();
});

