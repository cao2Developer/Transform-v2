/*
 * Page navigation (page block): docs-nav
 *
 * The script of docs-nav.css. It marks the link of the section on screen
 * (aria-current), moves the blue line under that link and adds the shadow
 * while the bar is stuck. A click on a link scrolls to its section.
 *
 * docs-nav is a custom element: the script starts when the element enters
 * the page and stops when it leaves, also when Storybook changes pages.
 */

// Events that end the lock after a click: the end of the scroll, or the
// user scrolling or typing before it ends
const UNLOCK_EVENTS = ['scrollend', 'wheel', 'touchstart', 'keydown'];

// The section of a link: the .docs-section around the element of its hash
const sectionOf = (link: HTMLAnchorElement): HTMLElement | null =>
    document
        .getElementById(link.hash.slice(1))
        ?.closest<HTMLElement>('.docs-section') ?? null;

const scrollBehavior = (): ScrollBehavior =>
    matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

class DocsNav extends HTMLElement {
    private links: HTMLAnchorElement[] = [];

    private current: HTMLAnchorElement | null = null;

    private frame = 0;

    // After a click, the clicked link stays current until the scroll
    // ends, so the line does not stop at each link on the way
    private locked = false;

    // The links change width when the font loads
    private readonly resizeObserver = new ResizeObserver(() => this.place());

    connectedCallback(): void {
        this.links = [
            ...this.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'),
        ];
        for (const link of this.links) {
            // For the hidden Medium copy of the label in docs-nav.css
            link.dataset.label = link.textContent ?? '';
            this.resizeObserver.observe(link);
        }
        this.addEventListener('click', this.onClick);
        window.addEventListener('scroll', this.onScroll, { passive: true });
        for (const type of UNLOCK_EVENTS) {
            window.addEventListener(type, this.unlock, { passive: true });
        }
        this.update();
        // The line slides only after one frame in its first place
        requestAnimationFrame(() =>
            requestAnimationFrame(() => this.setAttribute('data-ready', '')),
        );
    }

    disconnectedCallback(): void {
        this.removeEventListener('click', this.onClick);
        window.removeEventListener('scroll', this.onScroll);
        for (const type of UNLOCK_EVENTS) {
            window.removeEventListener(type, this.unlock);
        }
        this.resizeObserver.disconnect();
        cancelAnimationFrame(this.frame);
        this.frame = 0;
    }

    // At most one update per frame while the page scrolls
    private onScroll = (): void => {
        if (this.frame) return;
        this.frame = requestAnimationFrame(() => {
            this.frame = 0;
            this.update();
        });
    };

    private unlock = (): void => {
        if (!this.locked) return;
        this.locked = false;
        this.onScroll();
    };

    private onClick = (event: MouseEvent): void => {
        const link = (event.target as Element).closest<HTMLAnchorElement>('a');
        const section = link && sectionOf(link);
        if (!link || !section) return;
        event.preventDefault();
        this.locked = true;
        this.select(link);
        section.scrollIntoView({ behavior: scrollBehavior() });
    };

    private update(): void {
        const stuck = this.getBoundingClientRect().top <= 0;
        this.toggleAttribute('data-stuck', stuck);
        if (this.locked || this.links.length === 0) return;

        // The current link is the last one whose section has reached its
        // scroll-margin-top, under the bar. At the end of the page, it is
        // the last link, because the last section may never get there.
        const root = document.documentElement;
        const bottom = window.scrollY + window.innerHeight;
        const atEnd = window.scrollY > 0 && bottom >= root.scrollHeight - 1;
        let current = this.links[0];
        for (const link of this.links) {
            const section = sectionOf(link);
            if (!section) continue;
            const top = section.getBoundingClientRect().top;
            const margin = getComputedStyle(section).scrollMarginTop;
            if (top <= parseFloat(margin) + 1) current = link;
        }
        this.select(atEnd ? this.links[this.links.length - 1] : current);
    }

    private select(link: HTMLAnchorElement): void {
        if (link === this.current) return;
        this.current?.removeAttribute('aria-current');
        link.setAttribute('aria-current', 'true');
        this.current = link;
        this.place();
        this.reveal(link);
    }

    // Puts the blue line under the current link
    private place(): void {
        if (!this.current) return;
        const { offsetLeft, offsetWidth } = this.current;
        this.style.setProperty('--docs-nav-x', `${offsetLeft}px`);
        this.style.setProperty('--docs-nav-width', `${offsetWidth}px`);
    }

    // When the row scrolls sideways, keeps the current link in view
    private reveal(link: HTMLAnchorElement): void {
        const row = link.parentElement;
        if (!row || row.scrollWidth <= row.clientWidth) return;
        row.scrollTo({
            left: link.offsetLeft - (row.clientWidth - link.offsetWidth) / 2,
            behavior: scrollBehavior(),
        });
    }
}

if (!customElements.get('docs-nav')) {
    customElements.define('docs-nav', DocsNav);
}
