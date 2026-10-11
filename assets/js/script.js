$(document).ready(function () {

    $('#menu').click(function () {
        $(this).toggleClass('fa-times');
        $('.navbar').toggleClass('nav-toggle');
    });

    $(window).on('scroll load', function () {
        $('#menu').removeClass('fa-times');
        $('.navbar').removeClass('nav-toggle');

        // scroll-top button
        if (window.scrollY > 60) {
            document.querySelector('#scroll-top').classList.add('active');
        } else {
            document.querySelector('#scroll-top').classList.remove('active');
        }

        // scroll spy: highlight the section under the header; the last one once scrolled to the bottom
        const top = $(window).scrollTop() + $('header').outerHeight() + 80;
        const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
        let currentId = $('section').first().attr('id');
        $('section').each(function () {
            if (atBottom || $(this).offset().top <= top) currentId = $(this).attr('id');
        });
        $('.navbar ul li a').removeClass('active');
        $('.navbar').find(`[href="#${currentId}"]`).addClass('active');
    });

    // smooth scrolling
    $('a[href*="#"]').on('click', function (e) {
        if (this.hash && this.pathname === window.location.pathname) {
            e.preventDefault();
            const target = $(this.hash);
            if (!target.length) return;
            $('html, body').animate({
                scrollTop: target.offset().top - $('header').outerHeight(),
            }, 500, 'swing');
        }
    });

    // resume viewer: modal on desktop, native PDF viewer (new tab) on small screens
    const resumeModal = $('#resume-modal');
    const resumeFrame = $('#resume-frame');

    function closeResume() {
        resumeModal.attr('hidden', true);
        $('body').removeClass('modal-open');
    }

    $('.js-view-resume').on('click', function (e) {
        if (window.innerWidth < 768) return;
        e.preventDefault();
        if (!resumeFrame.attr('src')) {
            resumeFrame.attr('src', $(this).attr('href') + '#view=FitH');
        }
        resumeModal.removeAttr('hidden');
        $('body').addClass('modal-open');
        $('#resume-close').trigger('focus');
    });

    $('#resume-close').on('click', closeResume);
    resumeModal.on('click', function (e) {
        if (e.target === this) closeResume();
    });
    $(document).on('keydown', function (e) {
        if (e.key === 'Escape' && !resumeModal.is('[hidden]')) closeResume();
    });
});

// change title + favicon on tab visibility
document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === "visible") {
        document.title = "Portfolio | Davishankar Gaur";
        $("#favicon").attr("href", "assets/images/favicon.png");
    } else {
        document.title = "Come Back To Portfolio";
        $("#favicon").attr("href", "assets/images/favhand.png");
    }
});

// typed.js effect (this is only the typing text, not fade)
var typed = new Typed(".typing-text", {
    strings: ["Penetration Testing", "SOC", "Cybersecurity Engineering", "Network Security", "Cloud Security", "Governance Risk &amp; Compliance", "Information Security"],
    loop: true,
    typeSpeed: 50,
    backSpeed: 25,
    backDelay: 500,
});

// fetch skills from skills.json (grouped by category); no-cache revalidates so edits show up right away
async function fetchData() {
    const response = await fetch("skills.json", { cache: "no-cache" });
    const data = await response.json();
    return data;
}

function showSkills(groups) {
    let skillsContainer = document.getElementById("skillsContainer");
    skillsContainer.innerHTML = groups.map(group => `
        <div class="skill-group">
            <h3>${group.category}${group.note ? `<span>${group.note}</span>` : ""}</h3>
            <ul class="skill-list">
                ${group.skills.map((skill, i) => `
                <li class="skill" style="--i:${i}">
                    <img src="${skill.icon}" alt="" loading="lazy" />
                    <span>${skill.name}</span>
                </li>`).join("")}
            </ul>
        </div>`).join("");
}

fetchData().then(data => {
    showSkills(data);
    observeReveals(document.getElementById("skillsContainer"));
});

// ---------- motion & scroll effects ----------
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// type a command out character by character, then let the block cursor blink and hide
function typeCommand(el, startDelay = 0) {
    const target = el.querySelector('.type');
    if (!target || el.dataset.typed) return;
    el.dataset.typed = 'true';
    const parts = [...target.childNodes].map(node => ({ node, text: node.textContent }));
    parts.forEach(part => { part.node.textContent = ''; });
    el.classList.add('is-typing');
    let index = 0;
    let typed = 0;
    function step() {
        const part = parts[index];
        part.node.textContent = part.text.slice(0, ++typed);
        if (typed >= part.text.length) {
            index++;
            typed = 0;
        }
        if (index < parts.length) {
            setTimeout(step, 35 + Math.random() * 45);
        } else {
            el.classList.remove('is-typing');
            el.classList.add('is-typed');
        }
    }
    setTimeout(step, startDelay);
}

// count a number up from zero, easing out
function countUp(el) {
    const target = Number(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const start = performance.now();
    const duration = 1400;
    (function tick(now) {
        const t = Math.min(1, (now - start) / duration);
        el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3))) + suffix;
        if (t < 1) requestAnimationFrame(tick);
    })(start);
}

// reveal content as it scrolls into view; items entering together are staggered
const revealSelector = [
    'section:not(.home) .heading',
    '.fact-card', '.about .content > p', '.resumebtn',
    '.entry', '.project', '.skill-group', '.cert', '.edu',
    '.contact-lede', '.contact-actions',
].join(', ');

const revealObserver = ('IntersectionObserver' in window && !prefersReducedMotion)
    ? new IntersectionObserver(entries => {
        let order = 0;
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            const delay = Math.min(order++, 5) * 90;
            el.style.setProperty('--delay', `${delay}ms`);
            el.classList.add('is-visible');
            if (el.classList.contains('heading')) typeCommand(el, delay + 120);
            revealObserver.unobserve(el);
        });
    }, { threshold: 0, rootMargin: '0px 0px -12% 0px' })
    : null;

function observeReveals(root) {
    if (!revealObserver || !root) return;
    root.querySelectorAll(revealSelector).forEach(el => {
        if (el.classList.contains('reveal')) return;
        el.classList.add('reveal');
        revealObserver.observe(el);
    });
}
observeReveals(document);

// hero: type the prompt on load, count the stats up once they're on screen
if (!prefersReducedMotion) {
    const heroPrompt = document.querySelector('.home .eyebrow');
    if (heroPrompt) typeCommand(heroPrompt, 250);

    const stats = document.querySelector('.stats');
    const counters = stats ? [...stats.querySelectorAll('[data-count]')] : [];
    if (counters.length && 'IntersectionObserver' in window) {
        counters.forEach(el => { el.textContent = '0' + (el.dataset.suffix || ''); });
        const statsObserver = new IntersectionObserver(entries => {
            if (!entries.some(entry => entry.isIntersecting)) return;
            statsObserver.disconnect();
            setTimeout(() => counters.forEach(countUp), 550);
        });
        statsObserver.observe(stats);
    }
}

// scroll-linked effects, batched into one animation frame per scroll
const docEl = document.documentElement;
const bgFx = document.querySelector('.bg-fx');
const siteHeader = document.querySelector('header');
const heroLayers = [...document.querySelectorAll('.home > .wrap')];
const timeline = document.querySelector('.timeline');
const timelineEntries = timeline ? [...timeline.querySelectorAll('.entry')] : [];
let scrollQueued = false;

function updateOnScroll() {
    scrollQueued = false;
    const vh = window.innerHeight;
    const max = docEl.scrollHeight - vh;
    const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    siteHeader.style.setProperty('--progress', progress.toFixed(4));
    if (bgFx) bgFx.style.setProperty('--p', progress.toFixed(4));
    if (prefersReducedMotion) return;

    // hero (intro + stats together, so nothing overlaps) drifts down and fades as it scrolls away
    if (heroLayers.length && window.scrollY < vh) {
        const shift = `translate3d(0, ${(window.scrollY * 0.18).toFixed(1)}px, 0)`;
        const fade = Math.max(0, 1 - window.scrollY / (vh * 0.9)).toFixed(3);
        heroLayers.forEach(layer => {
            layer.style.transform = shift;
            layer.style.opacity = fade;
        });
    }

    // experience line fills toward 60% of the screen; each dot lights up as the line passes it
    if (timeline) {
        const box = timeline.getBoundingClientRect();
        const filled = Math.min(box.height, Math.max(0, vh * 0.6 - box.top));
        timeline.style.setProperty('--tl', (filled / box.height).toFixed(4));
        timelineEntries.forEach(entry => {
            const card = entry.querySelector('.card');
            const dotTop = card.getBoundingClientRect().top - box.top
                + parseFloat(getComputedStyle(card, '::before').top);
            entry.classList.toggle('is-reached', filled >= dotTop);
        });
    }
}
window.addEventListener('scroll', () => {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(updateOnScroll);
}, { passive: true });
window.addEventListener('resize', updateOnScroll);
updateOnScroll();

// cursor effects (mouse only): scanner grid in the background, glow inside cards
if (finePointer && bgFx) {
    let lastPointer = null;
    let pointerQueued = false;
    document.addEventListener('pointermove', e => {
        lastPointer = e;
        if (pointerQueued) return;
        pointerQueued = true;
        requestAnimationFrame(() => {
            pointerQueued = false;
            bgFx.style.setProperty('--gx', `${lastPointer.clientX}px`);
            bgFx.style.setProperty('--gy', `${lastPointer.clientY}px`);
            const card = lastPointer.target.closest && lastPointer.target.closest('.fact-card, .entry .card, .project, .cert, .edu');
            if (card) {
                const r = card.getBoundingClientRect();
                card.style.setProperty('--mx', `${lastPointer.clientX - r.left}px`);
                card.style.setProperty('--my', `${lastPointer.clientY - r.top}px`);
            }
        });
    }, { passive: true });
}

// disable some dev tools shortcuts
document.onkeydown = function (e) {
    if (e.keyCode == 123) { // F12
        return false;
    }
    if (e.ctrlKey && e.shiftKey && e.keyCode == 'I'.charCodeAt(0)) {
        return false;
    }
    if (e.ctrlKey && e.shiftKey && e.keyCode == 'C'.charCodeAt(0)) {
        return false;
    }
    if (e.ctrlKey && e.shiftKey && e.keyCode == 'J'.charCodeAt(0)) {
        return false;
    }
    if (e.ctrlKey && e.keyCode == 'U'.charCodeAt(0)) {
        return false;
    }
};
