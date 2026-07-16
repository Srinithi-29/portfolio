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

    // --- 2. Canvas Interactive Background ---
    const canvas = document.getElementById('bg-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;
        let particles = [];

        window.addEventListener('resize', () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            initParticles();
        });

        class Particle {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.size = Math.random() * 2;
                this.speedX = Math.random() * 0.5 - 0.25;
                this.speedY = Math.random() * 0.5 - 0.25;
                // Use the primary color (indigo) for light theme particles
                this.color = `rgba(79, 70, 229, ${Math.random() * 0.3})`; 
            }
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                if (this.x > width || this.x < 0) this.speedX *= -1;
                if (this.y > height || this.y < 0) this.speedY *= -1;
            }
            draw() {
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        function initParticles() {
            particles = [];
            let numParticles = (width * height) / 15000; 
            for (let i = 0; i < numParticles; i++) {
                particles.push(new Particle());
            }
        }

        function animateCanvas() {
            ctx.clearRect(0, 0, width, height);
            
            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                particles[i].draw();
                
                for (let j = i; j < particles.length; j++) {
                    let dx = particles[i].x - particles[j].x;
                    let dy = particles[i].y - particles[j].y;
                    let distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < 120) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(79, 70, 229, ${0.1 - distance/1200})`;
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }
            requestAnimationFrame(animateCanvas);
        }
        initParticles();
        animateCanvas();
    }

    // --- 3. 3D Tilt Effect on Elements ---
    const tiltElements = document.querySelectorAll('.tilt-element');
    tiltElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            el.style.transition = 'none'; // Instantly follow mouse without lag
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
            el.style.transition = 'all 0.5s ease';
            el.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        });
    });

    // --- 4. Typing Animation ---
    const textElement = document.querySelector('.typing-text');
    if (textElement) {
        const words = ["Full Stack Developer", "Software Engineer", "Problem Solver"];
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

    // --- 5. Scroll Reveals ---
    const revealElements = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right, .skill-pillar');
    
    const revealOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const revealOnScroll = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                
                // Clear inline transition delay after reveal so it doesn't affect hovers
                setTimeout(() => {
                    entry.target.style.transitionDelay = '0s';
                }, 1000);
                
                observer.unobserve(entry.target);
            }
        });
    }, revealOptions);

    revealElements.forEach(el => {
        revealOnScroll.observe(el);
    });

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
});
