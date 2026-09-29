document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Custom Cursor & Magnetic Elements ---
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorOutline = document.querySelector('.cursor-outline');
    const magneticElements = document.querySelectorAll('.magnetic');

    if (window.innerWidth > 768 && cursorDot && cursorOutline) {
        window.addEventListener('mousemove', (e) => {
            const posX = e.clientX;
            const posY = e.clientY;
            
            cursorDot.style.left = `${posX}px`;
            cursorDot.style.top = `${posY}px`;
            
            // Add a slight delay for the outline
            cursorOutline.animate({
                left: `${posX}px`,
                top: `${posY}px`
            }, { duration: 150, fill: "forwards" });
        });

        // Hover effects for magnetic elements
        magneticElements.forEach(el => {
            el.addEventListener('mousemove', (e) => {
                const rect = el.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                
                el.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
                
                cursorOutline.style.width = '60px';
                cursorOutline.style.height = '60px';
                cursorOutline.style.backgroundColor = 'rgba(79, 70, 229, 0.1)';
            });
            
            el.addEventListener('mouseleave', () => {
                el.style.transform = 'translate(0px, 0px)';
                
                cursorOutline.style.width = '40px';
                cursorOutline.style.height = '40px';
                cursorOutline.style.backgroundColor = 'transparent';
            });
        });

        // Grow cursor on all links
        document.querySelectorAll('a, button, .tilt-element').forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursorOutline.style.width = '60px';
                cursorOutline.style.height = '60px';
            });
            el.addEventListener('mouseleave', () => {
                if(!el.classList.contains('magnetic')) {
                    cursorOutline.style.width = '40px';
                    cursorOutline.style.height = '40px';
                }
            });
        });
    }

    // --- 2. Deep Space Parallax Starfield — Scroll-Reactive ---
    const canvas = document.getElementById('bg-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;

        // Scroll state
        let lastScrollY = window.scrollY;
        let scrollVelocity = 0;
        let targetScrollVelocity = 0;
        let scrollY = window.scrollY;
        let time = 0;

        window.addEventListener('resize', () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            initStarfield();
        });

        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            const delta = currentScrollY - lastScrollY;
            targetScrollVelocity = delta * 0.6;
            lastScrollY = currentScrollY;
            scrollY = currentScrollY;
            // Shift the grid overlay at a slow parallax rate (feels like it's floating at a different depth)
            const gridShift = (currentScrollY * 0.12) % 50;
            document.querySelector('.grid-overlay').style.setProperty('--grid-y', `${gridShift}px`);
        }, { passive: true });

        // ─── Star Layers ───────────────────────────────────────────
        // layer: { stars[], parallaxFactor, baseSpeed }
        const LAYER_CONFIGS = [
            { count: 220, sizeMin: 0.3, sizeMax: 0.8, speed: 0.012, parallax: 0.08,  color: [255, 255, 255] },  // far — tiny, slow
            { count: 110, sizeMin: 0.7, sizeMax: 1.4, speed: 0.025, parallax: 0.20,  color: [200, 210, 255] },  // mid
            { count:  55, sizeMin: 1.3, sizeMax: 2.2, speed: 0.045, parallax: 0.40,  color: [160, 180, 255] },  // near — large, fast
            { count:  18, sizeMin: 2.0, sizeMax: 3.2, speed: 0.065, parallax: 0.70,  color: [180, 150, 255] },  // foreground gems
        ];

        let layers = [];

        class Star {
            constructor(cfg) {
                this.cfg = cfg;
                this.init(true);
            }

            init(random = false) {
                this.x = Math.random() * width;
                this.y = random ? Math.random() * height : (Math.random() < 0.5 ? -5 : height + 5);
                this.size = this.cfg.sizeMin + Math.random() * (this.cfg.sizeMax - this.cfg.sizeMin);
                this.baseAlpha = 0.25 + Math.random() * 0.65;
                this.twinkleSpeed = 0.005 + Math.random() * 0.025;
                this.twinklePhase = Math.random() * Math.PI * 2;
                this.drift = (Math.random() - 0.5) * 0.06; // tiny horizontal drift
                this.offsetY = 0; // accumulated parallax offset
            }

            update(velocity) {
                this.twinklePhase += this.twinkleSpeed;
                // Slow drift
                this.x += this.drift;
                // Parallax: scroll velocity pushes stars at their layer depth
                this.offsetY -= velocity * this.cfg.parallax;
                // Slow constant upward drift to create infinite-scroll feel
                this.offsetY -= this.cfg.speed;
                // Wrap Y
                const ry = this.renderY();
                if (ry < -10) this.offsetY += height + 20;
                if (ry > height + 10) this.offsetY -= height + 20;
                // Wrap X
                if (this.x < -5) this.x = width + 5;
                if (this.x > width + 5) this.x = -5;
            }

            renderY() {
                return this.y + this.offsetY;
            }

            draw() {
                const ry = this.renderY();
                const twinkle = Math.sin(this.twinklePhase);
                const alpha = Math.max(0.05, this.baseAlpha + twinkle * 0.22);
                const r = this.cfg.color[0];
                const g = this.cfg.color[1];
                const b = this.cfg.color[2];

                ctx.save();
                // Soft glow for larger stars
                if (this.size > 1.5) {
                    ctx.shadowColor = `rgba(${r},${g},${b},0.7)`;
                    ctx.shadowBlur = this.size * 4;
                }
                ctx.beginPath();
                ctx.arc(this.x, ry, this.size * (0.88 + twinkle * 0.12), 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
                ctx.fill();
                // Cross-sparkle on the biggest stars
                if (this.size > 2.3) {
                    ctx.strokeStyle = `rgba(${r},${g},${b},${alpha * 0.5})`;
                    ctx.lineWidth = 0.5;
                    const sp = this.size * 3.5;
                    ctx.beginPath();
                    ctx.moveTo(this.x - sp, ry);
                    ctx.lineTo(this.x + sp, ry);
                    ctx.moveTo(this.x, ry - sp);
                    ctx.lineTo(this.x, ry + sp);
                    ctx.stroke();
                }
                ctx.restore();
            }
        }

        // ─── Shooting Stars ────────────────────────────────────────
        let shootingStars = [];

        class ShootingStar {
            constructor() {
                this.reset();
            }

            reset() {
                this.x = Math.random() * width * 1.2 - width * 0.1;
                this.y = Math.random() * height * 0.5;
                this.len = 80 + Math.random() * 160;
                this.angle = (15 + Math.random() * 30) * (Math.PI / 180); // shallow angle
                this.speed = 12 + Math.random() * 18;
                this.alpha = 0;
                this.state = 'fadein'; // fadein → active → fadeout → dead
                this.progress = 0;
                this.color = Math.random() < 0.6 ? [200,220,255] : [200,170,255];
            }

            update() {
                this.progress += this.speed;
                const dx = Math.cos(this.angle) * this.speed;
                const dy = Math.sin(this.angle) * this.speed;
                this.x += dx;
                this.y += dy;
                if (this.state === 'fadein') {
                    this.alpha += 0.06;
                    if (this.alpha >= 1) this.state = 'active';
                } else if (this.state === 'active') {
                    if (this.progress > this.len * 2.5) this.state = 'fadeout';
                } else if (this.state === 'fadeout') {
                    this.alpha -= 0.04;
                }
                return this.alpha > 0;
            }

            draw() {
                if (this.alpha <= 0) return;
                const tailX = this.x - Math.cos(this.angle) * this.len;
                const tailY = this.y - Math.sin(this.angle) * this.len;
                const grad = ctx.createLinearGradient(tailX, tailY, this.x, this.y);
                const [r, g, b] = this.color;
                grad.addColorStop(0, `rgba(${r},${g},${b},0)`);
                grad.addColorStop(0.7, `rgba(${r},${g},${b},${this.alpha * 0.4})`);
                grad.addColorStop(1, `rgba(${r},${g},${b},${this.alpha})`);
                ctx.save();
                ctx.strokeStyle = grad;
                ctx.lineWidth = 1.5;
                ctx.shadowColor = `rgba(${r},${g},${b},0.8)`;
                ctx.shadowBlur = 6;
                ctx.beginPath();
                ctx.moveTo(tailX, tailY);
                ctx.lineTo(this.x, this.y);
                ctx.stroke();
                ctx.restore();
            }
        }

        let shootingTimer = 0;
        const SHOOT_INTERVAL = 220; // frames between shooting stars

        // ─── Nebula Fog ────────────────────────────────────────────
        function drawNebula() {
            // Slowly drifting ambient colour clouds — purely cosmetic
            const t = time * 0.0004;
            const cx1 = width * (0.3 + Math.sin(t) * 0.12);
            const cy1 = height * (0.2 + Math.cos(t * 1.3) * 0.12);
            const g1 = ctx.createRadialGradient(cx1, cy1, 0, cx1, cy1, width * 0.38);
            g1.addColorStop(0, 'rgba(79,70,229,0.045)');
            g1.addColorStop(1, 'rgba(79,70,229,0)');
            ctx.fillStyle = g1; ctx.fillRect(0, 0, width, height);

            const cx2 = width * (0.75 + Math.sin(t * 0.8 + 2) * 0.10);
            const cy2 = height * (0.65 + Math.cos(t * 1.1) * 0.10);
            const g2 = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, width * 0.32);
            g2.addColorStop(0, 'rgba(139,92,246,0.04)');
            g2.addColorStop(1, 'rgba(139,92,246,0)');
            ctx.fillStyle = g2; ctx.fillRect(0, 0, width, height);

            const cx3 = width * (0.55 + Math.sin(t * 1.2 + 4) * 0.14);
            const cy3 = height * (0.42 + Math.cos(t * 0.9 + 1) * 0.14);
            const g3 = ctx.createRadialGradient(cx3, cy3, 0, cx3, cy3, width * 0.28);
            g3.addColorStop(0, 'rgba(6,182,212,0.03)');
            g3.addColorStop(1, 'rgba(6,182,212,0)');
            ctx.fillStyle = g3; ctx.fillRect(0, 0, width, height);
        }

        // ─── Scroll Warp Streaks ───────────────────────────────────
        // When scroll velocity is high, draw velocity lines to sell warp effect
        function drawWarpStreaks() {
            const absV = Math.abs(scrollVelocity);
            if (absV < 1.5) return;
            const streakCount = Math.min(30, Math.floor(absV * 3));
            const dir = scrollVelocity > 0 ? 1 : -1;
            ctx.save();
            for (let i = 0; i < streakCount; i++) {
                const x = Math.random() * width;
                const y = Math.random() * height;
                const streakLen = absV * (4 + Math.random() * 6) * dir;
                const alpha = Math.min(0.25, absV * 0.02) * (0.5 + Math.random() * 0.5);
                const grad = ctx.createLinearGradient(x, y, x, y + streakLen);
                grad.addColorStop(0, `rgba(200,210,255,0)`);
                grad.addColorStop(0.5, `rgba(200,210,255,${alpha})`);
                grad.addColorStop(1, `rgba(200,210,255,0)`);
                ctx.strokeStyle = grad;
                ctx.lineWidth = 0.5 + Math.random() * 0.8;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x, y + streakLen);
                ctx.stroke();
            }
            ctx.restore();
        }

        function initStarfield() {
            layers = LAYER_CONFIGS.map(cfg => ({
                cfg,
                stars: Array.from({ length: cfg.count }, () => new Star(cfg))
            }));
        }

        function animate() {
            time++;
            // Lerp scroll velocity
            scrollVelocity += (targetScrollVelocity - scrollVelocity) * 0.10;
            targetScrollVelocity *= 0.88;

            // Dark space gradient base
            const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
            bgGrad.addColorStop(0,   '#06070f');
            bgGrad.addColorStop(0.5, '#0b0c1a');
            bgGrad.addColorStop(1,   '#080912');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, width, height);

            // Nebula ambient blobs
            drawNebula();

            // Draw star layers back-to-front
            layers.forEach(({ cfg, stars }) => {
                stars.forEach(s => {
                    s.update(scrollVelocity);
                    s.draw();
                });
            });

            // Warp velocity streaks on fast scroll
            drawWarpStreaks();

            // Shooting stars
            shootingTimer++;
            if (shootingTimer >= SHOOT_INTERVAL + Math.random() * 120) {
                shootingStars.push(new ShootingStar());
                shootingTimer = 0;
            }
            shootingStars = shootingStars.filter(ss => {
                const alive = ss.update();
                if (alive) ss.draw();
                return alive;
            });

            requestAnimationFrame(animate);
        }

        initStarfield();
        animate();
    }

    // --- 2.5 3D Sphere Manual Rotation ---
    const sphere = document.querySelector('.sphere-wrapper');
    if (sphere) {
        // Disable CSS animation so JS can take over
        sphere.style.animation = 'none';
        
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };
        // Initial rotation
        let rotation = { x: 10, y: 0 };
        
        // Auto-spin variables
        let autoSpin = true;
        let autoSpinSpeed = 0.5; // degrees per frame
        
        // Update transform
        const updateSphereTransform = () => {
            sphere.style.transform = `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`;
        };
        
        // Animation loop for auto-spin
        const animateSphere = () => {
            if (autoSpin && !isDragging) {
                rotation.y += autoSpinSpeed;
                updateSphereTransform();
            }
            requestAnimationFrame(animateSphere);
        };
        animateSphere();
        
        // Drag events
        const startDrag = (e) => {
            isDragging = true;
            sphere.style.cursor = 'grabbing';
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            previousMousePosition = { x: clientX, y: clientY };
        };
        
        const onDrag = (e) => {
            if (!isDragging) return;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            
            const deltaMove = {
                x: clientX - previousMousePosition.x,
                y: clientY - previousMousePosition.y
            };
            
            rotation.y += deltaMove.x * 0.5;
            rotation.x -= deltaMove.y * 0.5;
            
            // Clamp X rotation so it doesn't flip completely
            rotation.x = Math.max(-80, Math.min(80, rotation.x));
            
            updateSphereTransform();
            
            previousMousePosition = { x: clientX, y: clientY };
        };
        
        const stopDrag = () => {
            isDragging = false;
            sphere.style.cursor = 'grab';
        };
        
        sphere.style.cursor = 'grab';
        sphere.addEventListener('mousedown', startDrag);
        window.addEventListener('mousemove', onDrag);
        window.addEventListener('mouseup', stopDrag);
        
        // Touch support
        sphere.addEventListener('touchstart', startDrag, { passive: true });
        window.addEventListener('touchmove', onDrag, { passive: true });
        window.addEventListener('touchend', stopDrag);
    }

    // --- 3. 3D Tilt Effect on Elements ---
    const tiltElements = document.querySelectorAll('.tilt-element');
    tiltElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            // Override CSS transitions and delays to ensure instant cursor response
            el.style.transition = 'transform 0.1s ease';
            el.style.transitionDelay = '0s';
        });

        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const tiltX = (y - centerY) / 10;
            const tiltY = (centerX - x) / 10;
            
            el.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`;
        });
        
        el.addEventListener('mouseleave', () => {
            // Smoothly animate back to normal
            el.style.transition = 'transform 0.5s ease';
            el.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
            
            // Clear the inline transition styles after returning to rest
            setTimeout(() => {
                el.style.transition = '';
            }, 500);
        });
    });

    // --- 4. Typing Animation ---
    const textElement = document.querySelector('.typing-text');
    if (textElement) {
        const words = ["Full-Stack Developer", "MERN Stack Specialist", "AI & REST API Engineer"];
        let wordIndex = 0;
        let charIndex = 0;
        let isDeleting = false;

        function typeEffect() {
            const currentWord = words[wordIndex];
            
            if (isDeleting) {
                textElement.textContent = currentWord.substring(0, charIndex - 1);
                charIndex--;
            } else {
                textElement.textContent = currentWord.substring(0, charIndex + 1);
                charIndex++;
            }

            let typeSpeed = isDeleting ? 50 : 100;

            if (!isDeleting && charIndex === currentWord.length) {
                isDeleting = true;
                typeSpeed = 2000;
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                wordIndex = (wordIndex + 1) % words.length;
                typeSpeed = 500;
            }
            setTimeout(typeEffect, typeSpeed);
        }
        setTimeout(typeEffect, 1000);
    }

    // --- 5. Scroll Reveals — Re-triggers EVERY pass (up & down) ---
    // Uses rAF + getBoundingClientRect for pixel-perfect, always-live detection.
    // No IntersectionObserver stale data issues.

    const revealTargets = [
        // General fade/slide reveals (hero, etc.)
        ...document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right'),
        // Skill pillars (contain .skill-fill bars)
        ...document.querySelectorAll('.skill-pillar'),
        // Journey nodes
        ...document.querySelectorAll('.journey-node'),
    ];

    // Threshold: how much of the element must be inside viewport to trigger IN (0–1)
    const TRIGGER_IN_RATIO  = 0.18;  // 18% visible → animate in
    const TRIGGER_OUT_RATIO = 0.0;   // fully out → reset (0 px still visible)

    function isEntering(el) {
        const r = el.getBoundingClientRect();
        const visibleHeight = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
        const ratio = Math.max(0, visibleHeight) / r.height;
        return ratio >= TRIGGER_IN_RATIO;
    }

    function isFullyOut(el) {
        const r = el.getBoundingClientRect();
        return r.bottom <= 0 || r.top >= window.innerHeight;
    }

    // Track state per element so we only add/remove class when state changes (no thrash)
    const revealState = new WeakMap();

    function resetSkillBars(pillar) {
        pillar.querySelectorAll('.skill-fill').forEach(bar => {
            // Force a reflow to restart the CSS transition from width=0
            bar.style.transition = 'none';
            bar.style.transform = 'scaleX(0)';
            // Void read forces reflow
            void bar.offsetWidth;
            // Re-enable transition on next tick so the fill animates
            bar.style.transition = '';
        });
    }

    function tickReveals() {
        revealTargets.forEach(el => {
            const wasActive = revealState.get(el) || false;

            if (!wasActive && isEntering(el)) {
                // Entering viewport → trigger IN
                el.classList.add('active');
                revealState.set(el, true);
            } else if (wasActive && isFullyOut(el)) {
                // Fully left viewport → reset for next pass
                el.classList.remove('active');
                revealState.set(el, false);
                // If this is a skill pillar, reset skill bars so they refill next time
                if (el.classList.contains('skill-pillar')) {
                    resetSkillBars(el);
                }
            }
        });

        requestAnimationFrame(tickReveals);
    }

    // Kick off the rAF loop
    requestAnimationFrame(tickReveals);

    // --- 6. Navbar & Active Link ---
    const navbar = document.getElementById('navbar');
    const sections = document.querySelectorAll('section');
    const navItems = document.querySelectorAll('.nav-links a');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (pageYOffset >= (sectionTop - sectionHeight / 3)) {
                current = section.getAttribute('id');
            }
        });

        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href').includes(current)) {
                item.classList.add('active');
            }
        });
    });

    // --- 7. Mobile Menu ---
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        document.querySelectorAll('.nav-links a').forEach(n => n.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
        }));
    }

    // --- 8. Glitch Text Hover Effect on Tags ---
    const glitchTags = document.querySelectorAll('.glitch-tag');
    glitchTags.forEach(tag => {
        tag.addEventListener('mouseenter', () => {
            const originalText = tag.getAttribute('data-text');
            const characters = '!<>-_\\/[]{}—=+*^?#_';
            let iteration = 0;
            let interval = setInterval(() => {
                tag.innerText = originalText
                    .split('')
                    .map((letter, index) => {
                        if(index < iteration) return originalText[index];
                        return characters[Math.floor(Math.random() * characters.length)];
                    })
                    .join('');
                
                if(iteration >= originalText.length) clearInterval(interval);
                iteration += 1 / 3;
            }, 30);
        });
    });

    // --- 9. Sticky Stacking Cards Scroll-Driven Scale Animation ---
    const stickyCards = document.querySelectorAll('.project-card-sticky');
    const projectsSection = document.getElementById('projects');

    if (stickyCards.length && projectsSection) {
        const updateStickyCardTransforms = () => {
            const totalCards = stickyCards.length;
            const sectionRect = projectsSection.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            
            // Calculate progress of projects section from when it enters view to when it exits
            const totalScrollableDist = sectionRect.height - windowHeight;
            if (totalScrollableDist <= 0) return;

            const currentScroll = -sectionRect.top;
            const scrollProgress = Math.max(0, Math.min(1, currentScroll / totalScrollableDist));

            stickyCards.forEach((card, index) => {
                const entryPoint = index / totalCards;
                if (scrollProgress >= entryPoint) {
                    const cardProgress = Math.min(1, (scrollProgress - entryPoint) / (1 - entryPoint || 1));
                    // Scale down smoothly like Framer Motion (1.0 -> 0.90)
                    const scaleX = 1 - (cardProgress * 0.10);
                    const scaleY = 1 - (cardProgress * 0.06);
                    card.style.transform = `scaleX(${scaleX.toFixed(4)}) scaleY(${scaleY.toFixed(4)})`;
                } else {
                    card.style.transform = 'scaleX(1) scaleY(1)';
                }
            });
        };

        window.addEventListener('scroll', updateStickyCardTransforms, { passive: true });
        window.addEventListener('resize', updateStickyCardTransforms, { passive: true });
        updateStickyCardTransforms();
    }
});

