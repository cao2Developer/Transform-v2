/*
 * Skeleton canvas (page block): <docs-skeleton>
 *
 * Draws the skeleton of a component (parts, spacing, sizes and tokens)
 * from the Skeleton export of Figma: sections/skeleton.json in the folder
 * of the component. The export holds the groups of states and their
 * layouts, so this block only draws them.
 *
 *     import skeleton from './sections/skeleton.json';
 *
 *     <docs-skeleton
 *         data={skeleton.variants.find((v) => v.variant === 'Default')}
 *     />
 *
 * Attributes:
 *   label   the variant, first in the title of each canvas, for example
 *           "Default". Default: the variant of data
 *   dir     ltr or rtl. Default: the dir of data. The drawing uses logical
 *           positions, so rtl flips the rulers and the start side. Only
 *           ltr is checked for now.
 *
 * With no data, or no groups, the element shows one line: "No skeleton data".
 * The styles are in docs-skeleton.css. How it works: README.md.
 */

const TAG = 'docs-skeleton';

/* Geometry of a cell. The rest is in the CSS (.docs-skeleton-canvas). */
const RULER = 'var(--docs-skeleton-ruler)'; // thickness of each ruler
const SIZE_GAP = 36; // space between the component and its size measures
const MEASURE_GAP = 14; // space between the component and a space measure
const MEASURE_TICK = 7; // length of the end ticks of a measure line
const NUMBER_ABOVE = 32; // from the component to a number above it
const NUMBER_BEFORE = 18; // from the component to a number before it
const NUMBER_BELOW = 10; // from a size measure to the number below it
const NUMBER_AFTER = 12; // from a size measure to the number after it
const TAG_GAP = 8; // space between the hovered item and the tag
const TAG_EDGE = 4; // least space between the tag and the edge of the cell

/* Events of <docs-skeleton>. Nothing listens to them now. They stay for
   a token table under the canvases, if it comes back. */
export const MEASURED_EVENT = 'docs-skeleton-measured';
export const HIGHLIGHT_EVENT = 'docs-skeleton-highlight'; // detail: key or null

/** One variant of the export: the value of the data property. */
export type SkeletonData = {
    variant: string | null; // null for a component with no variants
    dir: 'ltr' | 'rtl';
    groups: Group[];
};

/** A box in logical coordinates, from the outer top-start corner of the box. */
export type Box = {
    x: number; // inline offset from the start edge
    y: number; // block offset from the top edge
    w: number;
    h: number;
};

export type Axis = 'inline' | 'block';

/** A measure in the drawing. */
export type Mark = {
    key: string; // stable inside a component, for example "space:inline-start"
    kind: 'space' | 'size';
    axis: Axis;
    start: number; // from the outer start (inline) or top (block) edge
    size: number;
    token: string | null;
    tokenless: boolean;
    part: string; // name of the part, for the rows
    property: string; // property, for the rows
    // Size marks only: draw it on the spacing row (true) or on the size row
    // below and at the end (false).
    lead?: boolean;
    // The other axis, for a space inside a child element. Default: the whole
    // component.
    cross?: [number, number];
};

export type Part = {
    key: string;
    kind: 'box' | 'visible' | 'hidden' | 'dead';
    label: string; // name for the hover tag
    box: Box | null; // null for an element with display: none
};

/**
 * A row of the export: one measure with its value and token. The canvases
 * do not show the rows. They stay for a token table.
 */
export type Row = {
    key: string;
    part: string;
    property: string;
    px: number[]; // the value in px: one number, width and height, or none
    token: string | null; // the token, when exactly one makes the value
    formula: string | null; // the terms as text, when no single token does
    tokenless: boolean;
    ref: string; // key of the mark or part it points to
    kind: 'space' | 'size' | 'other'; // space rows show the color of the token
};

export type Layout = {
    width: number;
    height: number;
    parts: Part[];
    marks: Mark[];
    rows: Row[];
};

export type Group = {
    canvas?: string; // the node of the canvas in Figma
    states: string[];
    layouts: Layout[]; // one per state, same order
};

/** A token pinned by a click in the legend. */
type Pinned = { cell: HTMLElement; token: string; item: HTMLElement };

/** What the element knows about a highlighted part or mark. */
type Item = {
    canvas: HTMLElement;
    inline: [number, number];
    block: [number, number];
    end: number; // height of the component
    name: string | null; // the text of the tag. Marks have no tag
    // Spaces only: every space of the canvas with the same size, this one
    // included.
    peers: string[];
};

/** What drawPart and drawMark give back to drawCanvas. */
type Drawn = {
    key: string; // the ref of the item
    nodes: HTMLElement[]; // in the order they go into the cell
    item: Omit<Item, 'canvas' | 'end'>; // drawCanvas adds canvas and end
};

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

function round(value: number): number {
    return Math.round(value * 100) / 100;
}

function same(a: number, b: number): boolean {
    return Math.abs(a - b) < 0.5;
}

/**
 * The unit of every value on the page. One for all the canvases, so two
 * canvases of a doc page never show different units.
 */
let unit: 'px' | 'rem' = 'px';

/**
 * Zoom of the drawing: 1 or 2. It multiplies the geometry only. Lines and
 * text keep their size, and every value shown stays the real one. One for
 * all the canvases, like the unit. The drawing reads it from
 * --docs-skeleton-scale, which the CSS animates.
 */
let scale: 1 | 2 = 1;

/** A length in the current unit. rem follows the font size of the root. */
function formatAmount(px: number): string {
    if (unit === 'px') return `${Math.round(px * 10) / 10}`;
    const { fontSize } = getComputedStyle(document.documentElement);
    return `${Math.round((px / parseFloat(fontSize)) * 10000) / 10000}`;
}

/**
 * Writes lengths into a node, and keeps them in data-px so the unit can
 * change later without a new drawing. Two lengths read "16 × 16".
 * withUnit is false in the drawing, which shows only numbers.
 */
export function setAmount(
    node: HTMLElement,
    px: number[],
    withUnit = true,
): HTMLElement {
    node.dataset.px = px.join(' ');
    if (withUnit) node.dataset.withUnit = '';
    return paintAmount(node);
}

function paintAmount(node: HTMLElement): HTMLElement {
    const suffix = node.dataset.withUnit === undefined ? '' : unit;
    node.textContent = (node.dataset.px ?? '')
        .split(' ')
        .map((px) => `${formatAmount(Number(px))}${suffix}`)
        .join(' × ');
    return node;
}

/* ------------------------------------------------------------------ */
/* DOM helpers for the drawing                                         */
/* ------------------------------------------------------------------ */

export function makeNode(
    tag: string,
    className: string,
    text?: string,
): HTMLElement {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

/**
 * Positions with logical properties, so dir="rtl" flips the drawing. Each
 * value is px, or a CSS length.
 */
function place(
    node: HTMLElement,
    inline: number | string,
    block: number | string,
    inlineSize?: number | string,
    blockSize?: number | string,
): HTMLElement {
    const length = (value: number | string): string =>
        typeof value === 'number' ? `${value}px` : value;
    node.style.insetInlineStart = length(inline);
    node.style.insetBlockStart = length(block);
    if (inlineSize !== undefined) node.style.inlineSize = length(inlineSize);
    if (blockSize !== undefined) node.style.blockSize = length(blockSize);
    return node;
}

/** A length of the component on the screen. Real px, times the zoom. */
function zoomed(px: number): string {
    return `calc(${px}px * var(--docs-skeleton-scale))`;
}

/**
 * An inline position in the cell: px from the start of the component, plus
 * an offset that the zoom does not change.
 */
function inlineAt(px: number, offset = 0): string {
    return `calc(var(--_ox) + ${px}px * var(--docs-skeleton-scale) + ${offset}px)`;
}

/** A block position in the cell, like inlineAt. */
function blockAt(px: number, offset = 0): string {
    return `calc(var(--_oy) + ${px}px * var(--docs-skeleton-scale) + ${offset}px)`;
}

/**
 * A guide across the cell, at px from the component, on the given axis. The
 * CSS takes it to the end of the cell.
 */
function guideAt(axis: Axis, px: number): HTMLElement {
    const node = makeNode(
        'span',
        `docs-skeleton-guide docs-skeleton-guide--${axis}`,
    );
    return axis === 'inline'
        ? place(node, inlineAt(px), RULER)
        : place(node, RULER, blockAt(px));
}

function tokenAttribute(mark: Mark): string {
    if (mark.tokenless) return 'none';
    return mark.token ?? 'mixed';
}

/**
 * A docs-switch with its label. All the switches of the page with the same
 * label change together.
 */
function drawSwitch(
    label: string,
    checked: boolean,
    onChange: (checked: boolean) => void,
): HTMLElement {
    const row = makeNode('label', 'docs-switch-row');
    const input = document.createElement('input');
    input.className = 'docs-switch';
    input.type = 'checkbox';
    input.setAttribute('role', 'switch');
    input.dataset.size = 'compact';
    input.dataset.switch = label;
    input.checked = checked;
    row.append(input, makeNode('span', '', label));
    input.addEventListener('change', () => {
        for (const item of document.querySelectorAll<HTMLInputElement>(
            `input[data-switch="${label}"]`,
        ))
            item.checked = input.checked;
        onChange(input.checked);
    });
    return row;
}

/**
 * The px and rem switch. Every value of the page changes in place, with no
 * new drawing.
 */
function drawUnitSwitch(): HTMLElement {
    return drawSwitch('rem', unit === 'rem', (checked) => {
        unit = checked ? 'rem' : 'px';
        for (const item of document.querySelectorAll<HTMLElement>('[data-px]'))
            paintAmount(item);
    });
}

/**
 * The 2x switch. All the canvases of the page change together, and the CSS
 * animates the change, with no new drawing.
 */
function drawZoomSwitch(): HTMLElement {
    return drawSwitch('2x', scale === 2, (checked) => {
        scale = checked ? 2 : 1;
        for (const skeleton of document.querySelectorAll<HTMLElement>(TAG))
            skeleton.style.setProperty('--docs-skeleton-scale', String(scale));
    });
}

/* ------------------------------------------------------------------ */
/* One canvas                                                          */
/* ------------------------------------------------------------------ */

/**
 * The head of a canvas: the variant and the states in a canvas info
 * (docs-canvas-info), as the cells of docs-cells, then the switches.
 */
function drawHead(label: string | null, states: string[]): HTMLElement {
    const title = makeNode('p', 'docs-canvas-info');
    if (label) {
        const separator = makeNode('span', 'docs-canvas-info-separator', '·');
        separator.setAttribute('aria-hidden', 'true');
        title.append(
            makeNode('span', 'docs-canvas-info-variant', label),
            ' ',
            separator,
            ' ',
        );
    }
    title.append(states.join(', '));
    const controls = makeNode('div', 'docs-skeleton-controls');
    controls.append(drawZoomSwitch(), drawUnitSwitch());
    const head = makeNode('div', 'docs-skeleton-head');
    head.append(title, controls);
    return head;
}

/**
 * The rulers, on the edges of the canvas: top, side and the corner between
 * them. The 0 is at the top start corner of the component: --_origin (CSS)
 * moves the ticks to that corner. The side ruler is outside the drawing, so
 * it reaches the bottom of the canvas and stays in place when the drawing
 * scrolls.
 */
function drawRulers(): [HTMLElement, HTMLElement, HTMLElement] {
    const top = makeNode(
        'div',
        'docs-skeleton-ruler docs-skeleton-ruler--inline',
    );
    const side = makeNode(
        'div',
        'docs-skeleton-ruler docs-skeleton-ruler--block',
    );
    const corner = makeNode('div', 'docs-skeleton-corner');
    top.append(makeNode('div', 'docs-skeleton-range'));
    side.append(makeNode('div', 'docs-skeleton-range'));
    side.setAttribute('aria-hidden', 'true');
    corner.setAttribute('aria-hidden', 'true');
    return [top, side, corner];
}

/**
 * The faint guides: one from each edge of the component, of its parts and
 * of its marks, across the whole cell. They hide on hover.
 */
function drawFaintGuides(layout: Layout): HTMLElement {
    const faint = makeNode('div', 'docs-skeleton-faint-guides');
    const xs = new Set<number>([0, round(layout.width)]);
    const ys = new Set<number>([0, round(layout.height)]);
    for (const part of layout.parts) {
        if (!part.box || part.key === 'box') continue;
        xs.add(round(part.box.x));
        xs.add(round(part.box.x + part.box.w));
        ys.add(round(part.box.y));
        ys.add(round(part.box.y + part.box.h));
    }
    for (const mark of layout.marks) {
        const set = mark.axis === 'inline' ? xs : ys;
        set.add(round(mark.start));
        set.add(round(mark.start + mark.size));
    }
    for (const x of xs) faint.append(guideAt('inline', x));
    for (const y of ys) faint.append(guideAt('block', y));
    return faint;
}

/** One part: the component box, a visible or hidden element, or dead space. */
function drawPart(part: Part, box: Box, ref: (key: string) => string): Drawn {
    const key = ref(part.key);
    const node = place(
        makeNode('div', `docs-skeleton-part docs-skeleton-part--${part.kind}`),
        inlineAt(box.x),
        blockAt(box.y),
        zoomed(box.w),
        zoomed(box.h),
    );
    node.dataset.ref = key;
    return {
        key,
        nodes: [node],
        item: {
            inline: [box.x, box.x + box.w],
            block: [box.y, box.y + box.h],
            name: part.label,
            peers: [],
        },
    };
}

/**
 * One mark. A space: its hatched area, its measure line and its number,
 * which show on hover. A size: its measure line and its number, in gray.
 */
function drawMark(
    mark: Mark,
    layout: Layout,
    ref: (key: string) => string,
): Drawn {
    const { width, height } = layout;
    const key = ref(mark.key);
    const { start, size } = mark;
    const end = start + size;
    const alongInline = mark.axis === 'inline';
    const inline: [number, number] = alongInline
        ? [start, end]
        : (mark.cross ?? [0, width]);
    const block: [number, number] = alongInline
        ? (mark.cross ?? [0, height])
        : [start, end];
    // Spaces only: every space of the canvas with the same size, this one
    // included.
    const peers: string[] = [];
    if (mark.kind === 'space')
        for (const item of layout.marks)
            if (item.kind === 'space' && same(item.size, mark.size))
                peers.push(ref(item.key));

    const nodes: HTMLElement[] = [];
    if (mark.kind === 'space') {
        const area = place(
            makeNode('div', 'docs-skeleton-space'),
            inlineAt(inline[0]),
            blockAt(block[0]),
            zoomed(inline[1] - inline[0]),
            zoomed(block[1] - block[0]),
        );
        area.dataset.token = tokenAttribute(mark);
        area.dataset.ref = key;
        nodes.push(area);
    }
    const lead = mark.kind === 'space' || mark.lead;
    const measureNode = makeNode(
        'div',
        `docs-skeleton-measure-line docs-skeleton-measure-line--${mark.axis}`,
    );
    const number = setAmount(
        makeNode('span', 'docs-skeleton-number'),
        [mark.size],
        false,
    );
    // The numbers of the spaces show on hover. The legend shows them all
    // the time.
    if (mark.kind === 'space') {
        measureNode.classList.add('docs-skeleton-on-hover');
        number.classList.add('docs-skeleton-on-hover');
    }
    measureNode.dataset.token =
        mark.kind === 'size' ? 'size' : tokenAttribute(mark);
    number.dataset.token = measureNode.dataset.token;
    measureNode.dataset.ref = key;
    number.dataset.ref = key;
    if (alongInline) {
        place(
            measureNode,
            inlineAt(start),
            lead ? blockAt(0, -MEASURE_GAP) : blockAt(height, SIZE_GAP),
            zoomed(size),
            MEASURE_TICK,
        );
        place(
            number,
            inlineAt(start + size / 2),
            lead
                ? blockAt(0, -NUMBER_ABOVE)
                : blockAt(height, SIZE_GAP + NUMBER_BELOW),
        );
        number.classList.add('docs-skeleton-number--center');
    } else {
        place(
            measureNode,
            lead ? inlineAt(0, -MEASURE_GAP) : inlineAt(width, SIZE_GAP),
            blockAt(start),
            MEASURE_TICK,
            zoomed(size),
        );
        place(
            number,
            lead
                ? inlineAt(0, -NUMBER_BEFORE)
                : inlineAt(width, SIZE_GAP + NUMBER_AFTER),
            blockAt(start + size / 2),
        );
        number.classList.add(
            lead
                ? 'docs-skeleton-number--before'
                : 'docs-skeleton-number--after',
        );
    }
    nodes.push(measureNode, number);
    return { key, nodes, item: { inline, block, name: null, peers } };
}

/** A space item of the legend: the swatch of the token, then its text. */
function legendSpaceItem(token: string, text: HTMLElement): HTMLElement {
    const item = makeNode(
        'li',
        'docs-skeleton-legend-item docs-skeleton-legend-item--space',
    );
    item.dataset.token = token;
    const swatch = makeNode('span', 'docs-skeleton-swatch docs-skeleton-space');
    swatch.dataset.token = token;
    item.append(swatch, text);
    return item;
}

/** The legend of one canvas: the element types it shows, then its tokens. */
function drawLegend(group: Group): HTMLElement {
    const { parts, marks, rows } = group.layouts[0];
    const typeList = makeNode('ul', 'docs-skeleton-legend-list');
    for (const [kind, text] of [
        ['visible', 'Visible element'],
        ['hidden', 'Hidden element'],
        ['dead', 'Dead space'],
    ]) {
        if (!parts.some((part) => part.kind === kind && part.box)) continue;
        const item = makeNode('li', 'docs-skeleton-legend-item');
        item.append(
            makeNode(
                'span',
                `docs-skeleton-swatch docs-skeleton-part--${kind}`,
            ),
            makeNode('span', '', text),
        );
        typeList.append(item);
    }
    const tokens = new Map<string, number>();
    let tokenless = false;
    for (const mark of marks) {
        if (mark.kind !== 'space') continue;
        if (mark.tokenless) tokenless = true;
        else if (mark.token) tokens.set(mark.token, mark.size);
    }
    const tokenList = makeNode('ul', 'docs-skeleton-legend-list');
    for (const [token, px] of tokens) {
        const text = makeNode('span', '');
        text.append(
            `${token} `,
            setAmount(
                makeNode('strong', 'docs-skeleton-legend-value'),
                [px],
                false,
            ),
        );
        tokenList.append(legendSpaceItem(token, text));
    }
    const formula = rows.some((row) => row.kind === 'space' && row.formula);
    for (const [shown, token, text] of [
        [formula, 'mixed', 'Formula'],
        [tokenless, 'none', 'No token'],
    ] as const) {
        if (!shown) continue;
        tokenList.append(legendSpaceItem(token, makeNode('span', '', text)));
    }
    const legend = makeNode('div', 'docs-skeleton-legend');
    legend.append(typeList, tokenList);
    return legend;
}

/* ------------------------------------------------------------------ */
/* The element                                                         */
/* ------------------------------------------------------------------ */

export class DocsSkeleton extends HTMLElement {
    static get observedAttributes(): string[] {
        return ['dir', 'label'];
    }

    private _data: SkeletonData | null = null;
    private drawnWidth = 0;
    private refs = new Map<string, Item>();
    private current: string | null = null;
    private pinned: Pinned | null = null;

    /** What the element draws. */
    groups: Group[] = [];

    private observer = new ResizeObserver(() => {
        // Only a new width matters: the legend can wrap, and the canvas keeps
        // its height in --_legend.
        if (this.clientWidth !== this.drawnWidth) this.draw();
    });

    private onDocumentClick = (event: MouseEvent): void => {
        const target = event.target as Element;
        if (!target.closest('.docs-skeleton-legend-item--space'))
            this.unpin(true);
    };

    private onKeydown = (event: KeyboardEvent): void => {
        if (event.key === 'Escape') this.unpin(true);
    };

    get data(): SkeletonData | null {
        return this._data;
    }

    /** One variant of the export. Sets label and dir when the page did not. */
    set data(value: SkeletonData | null | undefined) {
        this._data = value ?? null;
        if (value?.variant && !this.hasAttribute('label'))
            this.setAttribute('label', value.variant);
        if (value?.dir && !this.hasAttribute('dir'))
            this.setAttribute('dir', value.dir);
        this.build();
    }

    connectedCallback(): void {
        document.addEventListener('click', this.onDocumentClick);
        document.addEventListener('keydown', this.onKeydown);
        this.build();
    }

    disconnectedCallback(): void {
        document.removeEventListener('click', this.onDocumentClick);
        document.removeEventListener('keydown', this.onKeydown);
        this.observer.disconnect();
    }

    attributeChangedCallback(): void {
        if (this.isConnected) this.build();
    }

    /** Draws again. Call it after a change the element cannot see. */
    refresh(): void {
        this.draw();
    }

    /** Draws when the fonts are ready, then again on a new width. */
    private async build(): Promise<void> {
        if (!this.isConnected) return;
        // sb-unstyled keeps the text styles of Storybook out.
        this.classList.add('docs-skeleton', 'sb-unstyled');
        if (!this._data?.groups?.length) {
            this.observer.disconnect();
            this.replaceChildren(
                makeNode('p', 'docs-skeleton-empty', 'No skeleton data'),
            );
            return;
        }
        // The legend height needs the real font.
        await document.fonts.ready;
        this.draw();
        this.observer.disconnect();
        this.observer.observe(this);
    }

    /** Draws one canvas per group of the export. */
    private draw(): void {
        const groups = this._data?.groups;
        if (!groups?.length) return;
        // Read before the canvases go: a shorter page can change the width.
        this.drawnWidth = this.clientWidth;
        this.style.setProperty('--docs-skeleton-scale', String(scale));
        this.replaceChildren();
        this.refs.clear();
        this.current = null;
        this.pinned = null;
        this.groups = groups;
        groups.forEach((group, index) => {
            const canvas = this.drawCanvas(group, index);
            this.append(canvas);
            // The legend sits over the end of the cell, so the guides reach
            // the bottom of the canvas. Its height is known only now.
            const legend = canvas.querySelector<HTMLElement>(
                '.docs-skeleton-legend',
            );
            canvas.style.setProperty(
                '--_legend',
                `${legend?.offsetHeight ?? 0}px`,
            );
        });
        this.dispatchEvent(new CustomEvent(MEASURED_EVENT));
    }

    /**
     * One canvas: the head, the rulers, the drawing and the legend of one
     * group of states. Positions are calc() over the zoom, so the CSS can
     * animate them (see inlineAt).
     */
    private drawCanvas(group: Group, index: number): HTMLElement {
        const layout = group.layouts[0];
        const { width, height } = layout;
        const canvas = makeNode('div', 'docs-skeleton-canvas');
        canvas.style.setProperty('--_width', `${width}px`);
        canvas.style.setProperty('--_height', `${height}px`);
        const head = drawHead(this.getAttribute('label'), group.states);

        // The size of the cell and the place of the component are in the
        // CSS (.docs-skeleton-canvas): the rulers fill the canvas, the component
        // sits in the middle of the area next to them, and a component wider
        // than the canvas scrolls with the drawing, at real size.
        const cell = makeNode('div', 'docs-skeleton-cell');
        const ref = (key: string): string => `g${index}-${key}`;
        // Puts the nodes of a part or a mark in the cell, and remembers its
        // item for the highlight.
        const keep = ({ key, nodes, item }: Drawn): void => {
            cell.append(...nodes);
            this.remember(key, { canvas, end: height, ...item });
        };

        const [top, side, corner] = drawRulers();
        cell.append(
            top,
            drawFaintGuides(layout),
            makeNode('div', 'docs-skeleton-guides'),
        );
        for (const part of layout.parts)
            if (part.box) keep(drawPart(part, part.box, ref));
        for (const mark of layout.marks) keep(drawMark(mark, layout, ref));
        cell.append(makeNode('div', 'docs-skeleton-tag'));
        this.wireDrawing(cell);

        // The drawing is hidden from screen readers. The legend is the
        // accessible content: the element types, and the tokens with their
        // values.
        const drawing = makeNode('div', 'docs-skeleton-drawing');
        drawing.setAttribute('aria-hidden', 'true');
        drawing.append(cell);
        const legend = drawLegend(group);
        this.wireLegend(legend, cell);
        canvas.append(head, drawing, legend, side, corner);
        return canvas;
    }

    /** Hover on the drawing highlights the item, and sends HIGHLIGHT_EVENT. */
    private wireDrawing(cell: HTMLElement): void {
        cell.addEventListener('pointerover', (event) => {
            const target = event.target as HTMLElement;
            this.highlight(
                target.closest('[data-ref]')?.getAttribute('data-ref') ?? null,
            );
        });
        cell.addEventListener('pointerleave', () => this.settle());
    }

    /**
     * Hover on a space in the legend lights the spaces of that token, as
     * hover on the drawing does. A click pins the token. Click again, click
     * elsewhere or press Escape to release it.
     */
    private wireLegend(legend: HTMLElement, cell: HTMLElement): void {
        for (const item of legend.querySelectorAll<HTMLElement>(
            '.docs-skeleton-legend-item--space',
        )) {
            const token = item.dataset.token;
            if (!token) continue;
            item.addEventListener('pointerenter', () =>
                this.lightToken(cell, token),
            );
            item.addEventListener('pointerleave', () => this.settle());
            item.addEventListener('click', () => {
                const again = this.pinned?.item === item;
                this.unpin(false);
                if (again) return;
                this.pinned = { cell, token, item };
                item.classList.add('is-pinned');
                this.lightToken(cell, token);
            });
        }
    }

    /** Lights every space of one token in a canvas, as hover on one does. */
    private lightToken(cell: HTMLElement, token: string): void {
        const areas = cell.querySelectorAll<HTMLElement>(
            `.docs-skeleton-space[data-token="${CSS.escape(token)}"]`,
        );
        const first = areas[0];
        if (!first) return;
        this.highlight(first.dataset.ref ?? null);
        for (const area of areas) area.classList.add('is-highlighted');
    }

    /** Clears the highlight, or goes back to the pinned token. */
    private settle(): void {
        this.highlight(null);
        if (this.pinned) this.lightToken(this.pinned.cell, this.pinned.token);
    }

    /** Releases the pinned token. clear also clears the highlight. */
    private unpin(clear: boolean): void {
        if (!this.pinned) return;
        this.pinned.item.classList.remove('is-pinned');
        this.pinned = null;
        if (clear) this.highlight(null);
    }

    private remember(key: string, item: Item): void {
        if (!this.refs.has(key)) this.refs.set(key, item);
    }

    /**
     * Shows one item: the ruler ranges, then the guides and the tag of an
     * element, or the numbers of the spaces of the same size. Null clears it.
     */
    highlight(key: string | null): void {
        if (key === this.current) return;
        this.current = key;
        for (const node of this.querySelectorAll(
            '.docs-skeleton-canvas, .docs-skeleton-canvas :is(.is-highlighted, .is-peer)',
        ))
            node.classList.remove('is-highlighted', 'is-peer', 'is-active');
        for (const node of this.querySelectorAll('.docs-skeleton-guides'))
            node.replaceChildren();
        for (const node of this.querySelectorAll(
            '.docs-skeleton-range, .docs-skeleton-tag',
        ))
            node.classList.remove('is-shown');
        this.dispatchEvent(new CustomEvent(HIGHLIGHT_EVENT, { detail: key }));
        if (!key) return;
        for (const node of this.querySelectorAll(
            `.docs-skeleton-canvas [data-ref="${key}"]`,
        ))
            node.classList.add('is-highlighted');
        const item = this.refs.get(key);
        if (!item) return;
        const { canvas, inline, block, peers } = item;
        canvas.classList.add('is-active');
        for (const peer of peers)
            for (const node of canvas.querySelectorAll(
                `.docs-skeleton-on-hover[data-ref="${peer}"]`,
            ))
                node.classList.add('is-peer');
        const guides = canvas.querySelector('.docs-skeleton-guides');
        // A space shows no guides, only the numbers.
        if (guides && !peers.length) {
            for (const x of inline) guides.append(guideAt('inline', x));
            for (const y of block) guides.append(guideAt('block', y));
        }
        const [rangeTop, rangeSide] = canvas.querySelectorAll<HTMLElement>(
            '.docs-skeleton-range',
        );
        this.showRange(rangeTop, inline, 'inline');
        this.showRange(rangeSide, block, 'block');
        if (item.name) this.showTag(item);
    }

    /**
     * The tag with the name of the item. It sits below the item, and below
     * the component when the item is near its bottom, in the space before
     * the width measure.
     */
    private showTag(item: Item): void {
        const { canvas, end, inline, block, name } = item;
        const tag = canvas.querySelector<HTMLElement>('.docs-skeleton-tag');
        if (!tag) return;
        tag.textContent = name;
        tag.classList.add('is-shown');
        const half = tag.offsetWidth / 2;
        const near = (end - block[1]) * scale < SIZE_GAP;
        place(
            tag,
            `clamp(calc(${RULER} + ${TAG_EDGE}px), ${inlineAt((inline[0] + inline[1]) / 2, -half)}, calc(var(--_cell) - ${half * 2 + TAG_EDGE}px))`,
            blockAt(near ? end : block[1], TAG_GAP),
        );
    }

    private showRange(
        node: HTMLElement,
        range: [number, number],
        axis: Axis,
    ): void {
        const size = zoomed(range[1] - range[0]);
        if (axis === 'inline')
            place(
                node,
                `calc(${inlineAt(range[0])} - ${RULER})`,
                0,
                size,
                RULER,
            );
        else place(node, 0, blockAt(range[0]), RULER, size);
        node.replaceChildren(
            setAmount(
                makeNode('span', 'docs-skeleton-range-start'),
                [range[0]],
                false,
            ),
            setAmount(
                makeNode('span', 'docs-skeleton-range-end'),
                [range[1]],
                false,
            ),
        );
        node.classList.add('is-shown');
    }
}

if (!customElements.get(TAG)) customElements.define(TAG, DocsSkeleton);
