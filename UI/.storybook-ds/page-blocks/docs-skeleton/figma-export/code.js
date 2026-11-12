/* eslint-disable @typescript-eslint/explicit-function-return-type -- plain JavaScript, no type annotations */
/*
 * Docs skeleton export: a Figma development plugin. Never published.
 *
 * It reads the selected canvas frames of the Skeleton section, runs the
 * checks of the export contract that need Figma, and sends the JSON to the
 * local receiver (receive.mjs). The receiver checks the JSON against the code
 * (check-skeleton.mjs) and writes it. How to run it: README.md.
 *
 * It is read only: it never changes a node, a component or a variable. It
 * only changes the selection and the view, for the Show buttons.
 *
 * The JSON maps to the types of the Skeleton canvas page block: Group,
 * Layout, Part, Mark and Row. Values are in px.
 */

/* Component keys of the documentation components (Foundation file, page
   Skeleton components). Keys of the component sets, or of the component when
   it has no variants. */
const KEYS = {
    canvasInfo: '3156ff84c21862e632e1e2f56a01d84c980668c3',
    boxInfo: 'eb5d78f1d4bb78a39025d91fe1eaa961166b4dd7',
    space: '33a5cebf9c336c07c8af2bd651b9596c8bdf5d36',
    element: '279737fc751283a196150ab0a965a9ddae6f082a',
    size: '43626dfe4ef191df1745aba254cf6ee33ab8198d',
    legendElements: '879de516424bcbd9a5492030fb508787980f59f1',
    legendSpacing: '2ad60b1b9028ad78f8e202cefb5eef57dffeab0d',
};

const RECEIVER = 'http://localhost:6008/skeleton';
const SIZE_AND_SPACING = 'Size & Spacing';
const BASE_UNITS = 'Base Units';
const SPACE_TOKENS = [
    'space-xs',
    'space-sm',
    'space-md',
    'space-lg',
    'space-xl',
    'column-gap',
];

/* ------------------------------------------------------------------ */
/* Results                                                             */
/* ------------------------------------------------------------------ */

const errors = [];
const warnings = [];
let currentCanvas = null;

function error(check, node, message) {
    errors.push({
        check,
        message,
        node: node ? node.id : null,
        canvas: currentCanvas,
    });
}

function warn(check, node, message) {
    warnings.push({
        check,
        message,
        node: node ? node.id : null,
        canvas: currentCanvas,
    });
}

/* ------------------------------------------------------------------ */
/* Figma helpers                                                       */
/* ------------------------------------------------------------------ */

const variables = new Map();
const collections = new Map();

async function variableById(id) {
    if (!variables.has(id))
        variables.set(id, await figma.variables.getVariableByIdAsync(id));
    return variables.get(id);
}

async function collectionOf(variable) {
    const id = variable.variableCollectionId;
    if (!collections.has(id))
        collections.set(
            id,
            await figma.variables.getVariableCollectionByIdAsync(id),
        );
    return collections.get(id);
}

/** The variable bound to a field of a node, or null. */
async function bound(node, field) {
    const binding = (node.boundVariables || {})[field];
    const alias = Array.isArray(binding) ? binding[0] : binding;
    return alias ? variableById(alias.id) : null;
}

/** The token name from the WEB code syntax: var(--space-lg) is space-lg. */
function tokenOf(variable) {
    const web = (variable.codeSyntax || {}).WEB || '';
    const match = /^var\(--([\w-]+)\)$/.exec(web.trim());
    return match ? match[1] : null;
}

/** The value of a variable in its default mode, through its aliases. */
async function valueOf(variable) {
    let current = variable;
    for (let i = 0; i < 10 && current; i += 1) {
        const collection = await collectionOf(current);
        const value = current.valuesByMode[collection.defaultModeId];
        if (value && value.type === 'VARIABLE_ALIAS')
            current = await variableById(value.id);
        else return value;
    }
    return null;
}

/** Check 10 for every variable bound to a piece. */
async function noBaseUnits(node, variable) {
    if (!variable) return;
    const collection = await collectionOf(variable);
    if (collection && collection.name === BASE_UNITS)
        error(
            10,
            node,
            `Variable "${variable.name}" is from ${BASE_UNITS}. Use a ${SIZE_AND_SPACING} variable.`,
        );
}

async function kindOf(instance) {
    const main = await instance.getMainComponentAsync();
    if (!main) return null;
    const key =
        main.parent && main.parent.type === 'COMPONENT_SET'
            ? main.parent.key
            : main.key;
    return Object.keys(KEYS).find((kind) => KEYS[kind] === key) || null;
}

/** Component properties by their name, without the #id suffix. */
function props(instance) {
    const result = {};
    for (const [name, prop] of Object.entries(instance.componentProperties))
        result[name.split('#')[0]] = prop.value;
    return result;
}

function absolute(node) {
    const t = node.absoluteTransform;
    return { x: t[0][2], y: t[1][2], w: node.width, h: node.height };
}

/** A Box in logical coordinates, from the outer top-start corner of the box. */
function boxIn(node, frame, rtl) {
    const a = absolute(node);
    const b = absolute(frame);
    return {
        x: rtl ? b.x + b.w - (a.x + a.w) : a.x - b.x,
        y: a.y - b.y,
        w: a.w,
        h: a.h,
    };
}

function round(value) {
    return Math.round(value * 100) / 100;
}

function rounded(box) {
    return {
        x: round(box.x),
        y: round(box.y),
        w: round(box.w),
        h: round(box.h),
    };
}

/** Check 15. */
function wholePixels(node, box) {
    if (
        [box.x, box.y, box.w, box.h].some(
            (n) => Math.abs(n - Math.round(n)) > 0.01,
        )
    )
        error(
            15,
            node,
            `Position or size is not whole pixels: ${box.x}, ${box.y}, ${box.w} x ${box.h}.`,
        );
}

function overlaps(a, b) {
    return (
        a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
    );
}

/** inner: a Box. frame: the box frame. */
function inside(inner, frame) {
    return (
        inner.x >= 0 &&
        inner.y >= 0 &&
        inner.x + inner.w <= frame.width + 0.01 &&
        inner.y + inner.h <= frame.height + 0.01
    );
}

function splitList(text) {
    return String(text || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
}

/** Instances and frames under a node, without going into instances. */
function piecesIn(node) {
    const instances = [];
    const frames = [];
    for (const child of node.children) {
        if (child.type === 'INSTANCE') instances.push(child);
        else if (child.type === 'FRAME') frames.push(child);
        else if ('children' in child) {
            const inner = piecesIn(child);
            instances.push(...inner.instances);
            frames.push(...inner.frames);
        }
    }
    return { instances, frames };
}

/* ------------------------------------------------------------------ */
/* Canvas Info (checks 1, 2)                                             */
/* ------------------------------------------------------------------ */

function readCanvasInfo(instance) {
    const p = props(instance);
    const component = String(p.component || '').trim();
    const states = splitList(p.states);
    const variant =
        p['has variant'] === false
            ? null
            : String(p.variant || '').trim() || null;
    const dir = p.dir === 'rtl' ? 'rtl' : 'ltr';
    return { component, states, variant, dir };
}

/** Check 2, the filled fields. The receiver checks the states against the doc. */
function check2(instance, info) {
    if (!info.component)
        error(2, instance, 'Canvas Info: "component" is empty.');
    if (!info.states.length)
        error(2, instance, 'Canvas Info: "states" is empty.');
}

/* ------------------------------------------------------------------ */
/* Boxes (checks 3, 4, 5, warning 2)                                   */
/* ------------------------------------------------------------------ */

async function readBox(frame, kinds) {
    const { instances, frames } = piecesIn(frame);
    const boxInfo = instances.find((i) => kinds.get(i) === 'boxInfo');
    const p = boxInfo ? props(boxInfo) : {};
    if (String(p.name || '').trim())
        error(
            3,
            frame,
            `Box Info "name" (${p.name}): wrappers are not supported yet.`,
        );
    for (const nested of frames)
        error(
            3,
            nested,
            'A frame inside the box: wrappers are not supported yet.',
        );
    return {
        node: frame,
        states: splitList(p.states),
        widthNoToken: p['width no token'] === true,
        heightNoToken: p['height no token'] === true,
        instances: instances.filter((i) => kinds.get(i) !== 'boxInfo'),
    };
}

/** Assigns states to boxes: an empty Box Info states means the other states. */
function check3(canvas, boxes, states) {
    const mains = boxes.filter((box) => !box.states.length);
    if (mains.length !== 1) {
        error(
            3,
            canvas,
            `Expected one main box (a frame with no Box Info states), found ${mains.length}.`,
        );
        return null;
    }
    const main = mains[0];
    const claimed = [];
    for (const box of boxes) {
        if (box === main) continue;
        if (
            Math.round(box.node.width) !== Math.round(main.node.width) ||
            Math.round(box.node.height) !== Math.round(main.node.height)
        )
            error(
                3,
                box.node,
                `Box size ${box.node.width} x ${box.node.height} differs from the main box (${main.node.width} x ${main.node.height}).`,
            );
        for (const state of box.states) {
            if (!states.includes(state))
                error(
                    3,
                    box.node,
                    `Box Info state "${state}" is not a state of the canvas.`,
                );
            else if (claimed.includes(state))
                error(3, box.node, `State "${state}" is in two boxes.`);
            else claimed.push(state);
        }
    }
    main.states = states.filter((state) => !claimed.includes(state));
    if (!main.states.length)
        error(
            3,
            main.node,
            'The main box has no state left: every state is in another box.',
        );
    return main;
}

/** Row of width or height of the box. */
async function sizeRow(box, field, noToken, ref) {
    const variable = await bound(box.node, field);
    await noBaseUnits(box.node, variable);
    if (variable) {
        const collection = await collectionOf(variable);
        if (
            collection.name !== SIZE_AND_SPACING ||
            !variable.scopes.some(
                (s) => s === 'WIDTH_HEIGHT' || s === 'ALL_SCOPES',
            )
        )
            error(
                4,
                box.node,
                `The box ${field} is bound to "${variable.name}", which is not a Width/Height variable of ${SIZE_AND_SPACING}.`,
            );
        if (noToken)
            error(
                5,
                box.node,
                `Box Info "${field} no token" is on, and the ${field} has a variable.`,
            );
    }
    return {
        key: `box|${field}`,
        part: box.name,
        property: field,
        px: [round(box.node[field])],
        token: variable ? tokenOf(variable) : null,
        formula: null,
        tokenless: noToken && !variable,
        ref,
        kind: 'other',
    };
}

/** Rows of the border and the radius of one box. */
async function borderRows(box, name, rtl) {
    const node = box.node;
    const rows = [];
    if (node.strokes.length && node.strokes.some((s) => s.visible !== false)) {
        if (node.strokeAlign !== 'INSIDE')
            error(
                4,
                node,
                `The box stroke is ${node.strokeAlign}. It must be inside.`,
            );
        const sides = [
            ['block-start', 'strokeTopWeight'],
            ['block-end', 'strokeBottomWeight'],
            ['inline-start', rtl ? 'strokeRightWeight' : 'strokeLeftWeight'],
            ['inline-end', rtl ? 'strokeLeftWeight' : 'strokeRightWeight'],
        ];
        const found = [];
        for (const [side, field] of sides) {
            const px = node[field];
            if (!(px > 0)) continue;
            const variable = await bound(node, field);
            await noBaseUnits(node, variable);
            const token = variable ? tokenOf(variable) : null;
            if (variable && !(token || '').startsWith('border-width-'))
                error(
                    4,
                    node,
                    `The ${side} border is bound to "${variable.name}", not a border-width-* variable.`,
                );
            if (!variable)
                warn(2, node, `The ${side} border (${px}px) has no variable.`);
            found.push({ side, px, token });
        }
        const allSides =
            found.length === 4 &&
            found.every(
                (f) => f.px === found[0].px && f.token === found[0].token,
            );
        for (const item of allSides ? [{ ...found[0], side: null }] : found) {
            const property = item.side
                ? `border-${item.side}-width`
                : 'border-width';
            rows.push({
                key: `box|${property}`,
                part: name,
                property,
                px: [round(item.px)],
                token: item.token,
                formula: null,
                tokenless: false,
                ref: 'box',
                kind: 'other',
            });
        }
    }
    const field = rtl ? 'topRightRadius' : 'topLeftRadius';
    const radius = node[field];
    if (radius > 0) {
        const variable = await bound(node, field);
        await noBaseUnits(node, variable);
        const token = variable ? tokenOf(variable) : null;
        if (variable && !(token || '').startsWith('radius-'))
            error(
                4,
                node,
                `The radius is bound to "${variable.name}", not a radius-* variable.`,
            );
        if (!variable)
            warn(2, node, `The radius (${radius}px) has no variable.`);
        rows.push({
            key: 'box|border-radius',
            part: name,
            property: 'border-radius',
            px: [round(radius)],
            token,
            formula: null,
            tokenless: false,
            ref: 'box',
            kind: 'other',
        });
    }
    return rows;
}

/* ------------------------------------------------------------------ */
/* Elements (checks 5, 6, 11)                                          */
/* ------------------------------------------------------------------ */

async function readElement(instance, frame, rtl, names, deadIndex) {
    const p = props(instance);
    const kind = ['visible', 'hidden', 'dead'].includes(p.kind)
        ? p.kind
        : 'visible';
    const name = String(p.name || '').trim();
    const noBox = p['no box'] === true;
    const box = rounded(boxIn(instance, frame, rtl));
    if (!noBox) {
        wholePixels(instance, box);
        if (!inside(box, frame))
            error(
                6,
                instance,
                `Element "${name || kind}" is not inside the box.`,
            );
    }
    if (kind !== 'dead') {
        if (!name) error(11, instance, `A ${kind} element has no "name".`);
        else if (names.has(name))
            error(
                11,
                instance,
                `Element name "${name}" repeats in the canvas.`,
            );
        names.add(name);
    }
    const dims = {};
    for (const field of ['width', 'height']) {
        const variable = await bound(instance, field);
        await noBaseUnits(instance, variable);
        const noToken = p[`${field} no token`] === true;
        const token = variable ? tokenOf(variable) : null;
        if (variable && !(token || '').startsWith('size-'))
            error(
                11,
                instance,
                `Element "${name}": the ${field} is bound to "${variable.name}", not a size-* variable.`,
            );
        if (variable && noToken)
            error(
                5,
                instance,
                `Element "${name}": "${field} no token" is on, and the ${field} has a variable.`,
            );
        dims[field] = { token, noToken: noToken && !variable };
    }
    const key = kind === 'dead' ? `dead:${deadIndex}` : `el:${name}`;
    return {
        node: instance,
        dims,
        part: {
            key,
            kind,
            label: kind === 'dead' ? 'Dead space' : name,
            box: noBox ? null : box,
        },
    };
}

/** Rows of an element: its size tokens, or the hidden element. */
function elementRows(element, component) {
    const { part, dims } = element;
    const rows = [];
    if (part.kind === 'dead' || !part.box) {
        if (part.kind === 'hidden')
            rows.push({
                key: `${part.key}|hidden`,
                part: `${component} > ${part.label}`,
                property: 'Hidden element',
                px: [],
                token: null,
                formula: null,
                tokenless: false,
                ref: part.key,
                kind: 'other',
            });
        return rows;
    }
    const { w, h } = part.box;
    const marked = (d) => d.token || d.noToken;
    if (dims.width.token && dims.width.token === dims.height.token) {
        rows.push({
            key: `${part.key}|width, height`,
            part: part.label,
            property: 'width, height',
            px: [w, h],
            token: dims.width.token,
            formula: null,
            tokenless: false,
            ref: part.key,
            kind: 'size',
        });
    } else {
        for (const [field, px] of [
            ['width', w],
            ['height', h],
        ]) {
            const d = dims[field];
            if (!marked(d)) continue;
            rows.push({
                key: `${part.key}|${field}`,
                part: part.label,
                property: field,
                px: [px],
                token: d.token,
                formula: null,
                tokenless: d.noToken,
                ref: part.key,
                kind: 'size',
            });
        }
    }
    if (part.kind === 'hidden')
        rows.push({
            key: `${part.key}|hidden`,
            part: `${component} > ${part.label}`,
            property: 'Hidden element',
            px: [w, h],
            token: null,
            formula: null,
            tokenless: false,
            ref: part.key,
            kind: 'other',
        });
    return rows;
}

/* ------------------------------------------------------------------ */
/* Spaces (checks 6, 7, 8, 9)                                          */
/* ------------------------------------------------------------------ */

async function readSpace(instance, frame, rtl) {
    const p = props(instance);
    const axis =
        p.orientation === 'Left' || p.orientation === 'Right'
            ? 'block'
            : 'inline';
    const field = axis === 'inline' ? 'width' : 'height';
    const box = rounded(boxIn(instance, frame, rtl));
    wholePixels(instance, box);
    if (!inside(box, frame))
        error(6, instance, `Space "${p.token}" is not inside the box.`);
    const size = axis === 'inline' ? box.w : box.h;
    const variable = await bound(instance, field);
    await noBaseUnits(instance, variable);
    const space = {
        node: instance,
        axis,
        box,
        size,
        token: null,
        tokenless: false,
        formula: null,
    };

    if (SPACE_TOKENS.includes(p.token)) {
        // Check 7.
        if (!variable) {
            error(
                7,
                instance,
                `Space "${p.token}": the ${field} has no variable.`,
            );
        } else {
            const token = tokenOf(variable);
            if (token !== p.token)
                error(
                    7,
                    instance,
                    `Space "${p.token}": the ${field} is bound to "${token || variable.name}".`,
                );
            const value = await valueOf(variable);
            if (typeof value === 'number' && Math.abs(value - size) > 0.01)
                error(
                    7,
                    instance,
                    `Space "${p.token}": the ${field} is ${size}, and ${token} is ${value}.`,
                );
            space.token = token;
        }
    } else if (p.token === 'none') {
        // Check 8.
        if (variable)
            error(
                8,
                instance,
                `A "none" Space has the variable "${variable.name}".`,
            );
        space.tokenless = true;
    } else if (p.token === 'formula') {
        space.formula = check9(instance, String(p.terms || '').trim());
    }
    return space;
}

/** Check 9, the syntax only. The receiver checks the tokens and the sum
    against the code. Returns the formula text, or null when the layout made
    the value. */
function check9(instance, terms) {
    if (!terms || terms === '-') return null;
    const parts = terms.split(/\s+([+-])\s+/);
    const text = [];
    for (let i = 0; i < parts.length; i += 2) {
        const term = parts[i].trim().replace(/^--/, '');
        const number = /^\d+(\.\d+)?$/.test(term);
        if (!number && !/^[a-z][a-z0-9-]*$/.test(term)) {
            error(
                9,
                instance,
                `Formula term "${term}" is not a number or a token name.`,
            );
            return null;
        }
        text.push(
            `${i ? `${parts[i - 1]} ` : ''}${number ? term : `--${term}`}`,
        );
    }
    return text.join(' ');
}

/** Padding or gap, from the position (same rule as v1). */
function roleOf(space, frame, borders) {
    const inline = space.axis === 'inline';
    const start = inline ? space.box.x : space.box.y;
    const end = start + space.size;
    const length = inline ? frame.width : frame.height;
    const [bStart, bEnd] = inline
        ? [borders.inlineStart, borders.inlineEnd]
        : [borders.blockStart, borders.blockEnd];
    if (start === 0 || start === bStart)
        return { edge: 'start', fromOuter: start === 0 && bStart > 0 };
    if (end === length || end === length - bEnd)
        return { edge: 'end', fromOuter: end === length && bEnd > 0 };
    return null;
}

/* ------------------------------------------------------------------ */
/* Sizes (check 13)                                                    */
/* ------------------------------------------------------------------ */

function readSize(instance, frame, rtl, targets) {
    const p = props(instance);
    const axis =
        p.orientation === 'Left' || p.orientation === 'Right'
            ? 'block'
            : 'inline';
    const box = rounded(boxIn(instance, frame, rtl));
    wholePixels(instance, box);
    const target = targets.find((t) =>
        axis === 'block'
            ? t.box.y === box.y && t.box.h === box.h
            : t.box.x === box.x && t.box.w === box.w,
    );
    if (!target) {
        error(
            13,
            instance,
            `Size "${p.number}" does not cover the ${axis === 'block' ? 'height' : 'width'} of the box or of an element.`,
        );
        return null;
    }
    const size = axis === 'block' ? target.box.h : target.box.w;
    if (String(p.number).trim() !== String(size))
        error(
            13,
            instance,
            `Size "number" is ${p.number}, and the ${axis === 'block' ? 'height' : 'width'} is ${size}.`,
        );
    return {
        key: `size:${target.key}:${axis}`,
        kind: 'size',
        axis,
        start: axis === 'block' ? target.box.y : target.box.x,
        size,
        token: null,
        tokenless: false,
        part: target.label,
        property: axis === 'block' ? 'height' : 'width',
        lead: box.y + box.h <= 0,
        ref: target.key,
    };
}

/* ------------------------------------------------------------------ */
/* Warnings 3 and 4                                                    */
/* ------------------------------------------------------------------ */

function warning3(main, spaces, elements, borders) {
    const from = borders.inlineStart;
    const to = main.node.width - borders.inlineEnd;
    const ranges = [
        ...spaces
            .filter((s) => s.axis === 'inline')
            .map((s) => [s.box.x, s.box.x + s.box.w]),
        ...elements
            .filter((e) => e.part.box)
            .map((e) => [e.part.box.x, e.part.box.x + e.part.box.w]),
    ].sort((a, b) => a[0] - b[0]);
    let at = from;
    for (const [start, end] of ranges) {
        if (start > at + 0.01 && start <= to)
            warn(
                3,
                main.node,
                `Inline space from ${at} to ${start} has no Space or dead element.`,
            );
        at = Math.max(at, end);
    }
    if (at < to - 0.01)
        warn(
            3,
            main.node,
            `Inline space from ${at} to ${to} has no Space or dead element.`,
        );
}

function warning4(legends, used) {
    const elements = legends.find((l) => l.kind === 'legendElements');
    const spacing = legends.find((l) => l.kind === 'legendSpacing');
    if (!elements)
        warn(4, null, 'The canvas has no Skeleton / Legend / Elements.');
    if (!spacing)
        warn(4, null, 'The canvas has no Skeleton / Legend / Spacing.');
    const expect = (legend, item, isUsed) => {
        const on = props(legend.node)[item] === true;
        if (on && !isUsed)
            warn(
                4,
                legend.node,
                `Legend item "${item}" is on, and the canvas does not use it.`,
            );
        if (!on && isUsed)
            warn(
                4,
                legend.node,
                `The canvas uses "${item}", and its legend item is off.`,
            );
    };
    if (elements) {
        expect(elements, 'hidden element', used.hidden);
        expect(elements, 'dead space', used.dead);
    }
    if (spacing) {
        for (const item of Object.keys(props(spacing.node))) {
            if (item === 'no token') expect(spacing, item, used.noToken);
            else if (item === 'formula') expect(spacing, item, used.formula);
            else expect(spacing, item, used.tokens.has(item.split(' ')[0]));
        }
    }
}

/* ------------------------------------------------------------------ */
/* One canvas                                                          */
/* ------------------------------------------------------------------ */

/** A mark without the fields that only the export uses. */
function cleanMark(mark) {
    const copy = { ...mark };
    delete copy.formula;
    delete copy.ref;
    return copy;
}

async function exportCanvas(canvas) {
    // Check 1.
    if (!canvas || canvas.type !== 'FRAME') {
        error(
            1,
            canvas,
            `Linked node ${canvas ? canvas.id : ''} is not a frame.`,
        );
        return null;
    }
    const { instances, frames } = piecesIn(canvas);
    const kinds = new Map();
    for (const instance of instances)
        kinds.set(instance, await kindOf(instance));
    for (const frame of frames)
        for (const instance of piecesIn(frame).instances)
            kinds.set(instance, await kindOf(instance));

    const canvasInfos = instances.filter((i) => kinds.get(i) === 'canvasInfo');
    if (canvasInfos.length !== 1) {
        error(
            1,
            canvas,
            `The canvas has ${canvasInfos.length} Documentation / Canvas Info. It needs exactly one.`,
        );
        return null;
    }
    for (const loose of instances.filter((i) =>
        ['space', 'element'].includes(kinds.get(i)),
    ))
        error(6, loose, 'A Space or an Element is outside the box frame.');

    const info = readCanvasInfo(canvasInfos[0]);
    check2(canvasInfos[0], info);

    const boxes = [];
    for (const frame of frames) boxes.push(await readBox(frame, kinds));
    const main = check3(canvas, boxes, info.states);
    if (!main) return null;
    const frame = main.node;
    const rtl = info.dir === 'rtl';
    main.name = info.component;

    // Borders, for the role of the spaces.
    const left = frame.strokes.length ? frame.strokeLeftWeight : 0;
    const right = frame.strokes.length ? frame.strokeRightWeight : 0;
    const borders = {
        blockStart: frame.strokes.length ? frame.strokeTopWeight : 0,
        blockEnd: frame.strokes.length ? frame.strokeBottomWeight : 0,
        inlineStart: rtl ? right : left,
        inlineEnd: rtl ? left : right,
    };

    // Elements.
    const names = new Set();
    const elements = [];
    for (const instance of main.instances.filter(
        (i) => kinds.get(i) === 'element',
    ))
        elements.push(
            await readElement(
                instance,
                frame,
                rtl,
                names,
                elements.filter((e) => e.part.kind === 'dead').length,
            ),
        );

    // Spaces.
    const spaces = [];
    for (const instance of main.instances.filter(
        (i) => kinds.get(i) === 'space',
    ))
        spaces.push(await readSpace(instance, frame, rtl));

    // Check 12.
    for (let i = 0; i < spaces.length; i += 1) {
        for (let j = i + 1; j < spaces.length; j += 1)
            if (overlaps(spaces[i].box, spaces[j].box))
                error(12, spaces[j].node, 'Two Spaces overlap.');
        for (const element of elements)
            if (element.part.box && overlaps(spaces[i].box, element.part.box))
                error(
                    12,
                    spaces[i].node,
                    `A Space overlaps the element "${element.part.label}".`,
                );
    }

    // Marks of the spaces, in order on each axis.
    spaces.sort((a, b) =>
        a.axis === b.axis
            ? a.axis === 'inline'
                ? a.box.x - b.box.x
                : a.box.y - b.box.y
            : a.axis === 'inline'
              ? -1
              : 1,
    );
    const gaps = { inline: 0, block: 0 };
    const marks = spaces.map((space) => {
        const role = roleOf(space, frame, borders);
        const inline = space.axis === 'inline';
        let key;
        let property;
        if (role) {
            key = `space:${space.axis}-${role.edge}`;
            property = `padding-${space.axis}-${role.edge}${role.fromOuter ? ', from the outer edge' : ''}`;
        } else {
            key = `gap:${space.axis}:${gaps[space.axis]++}`;
            property = inline ? 'column-gap' : 'row-gap';
        }
        return {
            key,
            kind: 'space',
            axis: space.axis,
            start: inline ? space.box.x : space.box.y,
            size: space.size,
            token: space.token,
            tokenless: space.tokenless,
            part: info.component,
            property,
            cross: inline
                ? [space.box.y, space.box.y + space.box.h]
                : [space.box.x, space.box.x + space.box.w],
            formula: space.formula,
        };
    });

    // Sizes.
    const boxPart = {
        key: 'box',
        kind: 'box',
        label: info.component,
        box: { x: 0, y: 0, w: round(frame.width), h: round(frame.height) },
    };
    wholePixels(frame, boxPart.box);
    const targets = [
        boxPart,
        ...elements.map((e) => e.part).filter((p) => p.box),
    ];
    for (const instance of instances.filter((i) => kinds.get(i) === 'size')) {
        const mark = readSize(instance, frame, rtl, targets);
        if (mark) marks.push(mark);
    }
    const sizeRef = (key, axis) =>
        marks.find((m) => m.key === `size:${key}:${axis}`)
            ? `size:${key}:${axis}`
            : key;

    // Rows shared by every state.
    const widthRow = await sizeRow(
        main,
        'width',
        main.widthNoToken,
        sizeRef('box', 'inline'),
    );
    const heightRow = await sizeRow(
        main,
        'height',
        main.heightNoToken,
        sizeRef('box', 'block'),
    );
    for (const mark of marks.filter(
        (m) => m.kind === 'size' && m.ref === 'box',
    )) {
        const row = mark.axis === 'inline' ? widthRow : heightRow;
        mark.token = row.token;
        mark.tokenless = row.tokenless;
    }
    const spaceRows = marks
        .filter((m) => m.kind === 'space')
        .map((m) => ({
            key: `${m.key}|${m.property}`,
            part: m.part,
            property: m.property,
            px: [m.size],
            token: m.token,
            formula: m.formula,
            tokenless: m.tokenless,
            ref: m.key,
            kind: 'space',
        }));
    const elementRowList = elements.flatMap((e) =>
        elementRows(e, info.component),
    );
    for (const row of elementRowList)
        if (row.kind === 'size')
            row.ref = sizeRef(
                row.ref,
                row.property === 'height' ? 'block' : 'inline',
            );

    // Rows of each box: the border and the radius.
    const boxRows = new Map();
    for (const box of boxes)
        boxRows.set(box, await borderRows(box, info.component, rtl));

    // Warnings 3 and 4.
    warning3(main, spaces, elements, borders);
    warning4(
        instances
            .filter((i) =>
                ['legendElements', 'legendSpacing'].includes(kinds.get(i)),
            )
            .map((node) => ({ node, kind: kinds.get(node) })),
        {
            hidden: elements.some((e) => e.part.kind === 'hidden'),
            dead: elements.some((e) => e.part.kind === 'dead'),
            noToken:
                spaces.some((s) => s.tokenless) ||
                main.widthNoToken ||
                main.heightNoToken ||
                elements.some(
                    (e) => e.dims.width.noToken || e.dims.height.noToken,
                ),
            formula: spaces.some((s) => !s.token && !s.tokenless),
            tokens: new Set(spaces.map((s) => s.token).filter(Boolean)),
        },
    );

    // One Layout per state, in the order of Canvas Info.
    const parts = [boxPart, ...elements.map((e) => e.part)];
    const cleanMarks = marks.map(cleanMark);
    const layouts = info.states.map((state) => {
        const box = boxes.find((b) => b.states.includes(state)) || main;
        return {
            width: boxPart.box.w,
            height: boxPart.box.h,
            parts,
            marks: cleanMarks,
            rows: [
                widthRow,
                heightRow,
                ...spaceRows,
                ...elementRowList,
                ...boxRows.get(box),
            ],
            components: [],
        };
    });
    return { info, group: { canvas: canvas.id, states: info.states, layouts } };
}

/* ------------------------------------------------------------------ */
/* Every canvas                                                        */
/* ------------------------------------------------------------------ */

/** Exports the canvases with these node ids, in this order. */
async function exportSkeleton(ids) {
    errors.length = 0;
    warnings.length = 0;
    const files = new Map();
    const seen = new Map();
    for (const id of ids) {
        currentCanvas = id;
        const node = await figma.getNodeByIdAsync(id);
        let page = node;
        while (page && page.type !== 'PAGE') page = page.parent;
        if (page) await page.loadAsync();
        const result = await exportCanvas(node);
        if (!result) continue;
        const { info, group } = result;

        // Check 14.
        for (const state of info.states) {
            const key = [info.component, info.variant, info.dir, state].join(
                '|',
            );
            if (seen.has(key))
                error(
                    14,
                    node,
                    `${info.component} ${info.variant || ''} ${info.dir} "${state}" is also in canvas ${seen.get(key)}.`,
                );
            else seen.set(key, id);
        }

        if (!files.has(info.component))
            files.set(info.component, {
                component: info.component,
                figma: { fileKey: figma.fileKey, canvases: [] },
                variants: [],
            });
        const file = files.get(info.component);
        file.figma.canvases.push(id);
        let variant = file.variants.find(
            (v) => v.variant === info.variant && v.dir === info.dir,
        );
        if (!variant)
            file.variants.push(
                (variant = {
                    variant: info.variant,
                    dir: info.dir,
                    groups: [],
                }),
            );
        variant.groups.push(group);
    }
    currentCanvas = null;
    if (ids.length && !figma.fileKey)
        error(
            null,
            null,
            'The plugin cannot read the file key. Check "enablePrivatePluginApi" in manifest.json.',
        );
    return {
        json: [...files.values()],
        errors: [...errors],
        warnings: [...warnings],
    };
}

/* ------------------------------------------------------------------ */
/* Plugin                                                              */
/* ------------------------------------------------------------------ */

let canvasIds = [];
let last = null;

/** The selected nodes in reading order: rows from top to bottom, and each
    row from left to right. Figma does not document the order of the
    selection. */
function readingOrder(nodes) {
    const rows = [];
    for (const node of [...nodes].sort(
        (a, b) => absolute(a).y - absolute(b).y,
    )) {
        const box = absolute(node);
        const row = rows[rows.length - 1];
        if (row && box.y < row.top + row.height / 2) row.nodes.push(node);
        else rows.push({ top: box.y, height: box.h, nodes: [node] });
    }
    return rows.flatMap((row) =>
        row.nodes.sort((a, b) => absolute(a).x - absolute(b).x),
    );
}

async function run() {
    const canvases = [];
    try {
        last = await exportSkeleton(canvasIds);
        for (const id of canvasIds) {
            const node = await figma.getNodeByIdAsync(id);
            canvases.push({ id, name: node ? node.name : id });
        }
    } catch (err) {
        const message = `The export stopped: ${err && err.message ? err.message : err}`;
        last = {
            json: [],
            errors: [{ check: null, message, node: null, canvas: null }],
            warnings: [],
        };
    }
    figma.ui.postMessage({ type: 'result', canvases, ...last });
}

/** Selects a node and zooms to it, on its own page. */
async function show(id) {
    const node = id ? await figma.getNodeByIdAsync(id) : null;
    if (!node) return;
    let page = node;
    while (page.type !== 'PAGE') page = page.parent;
    if (page !== figma.currentPage) await figma.setCurrentPageAsync(page);
    page.selection = [node];
    figma.viewport.scrollAndZoomIntoView([node]);
}

async function save() {
    if (!last || last.errors.length || !last.json.length) return;
    let result;
    try {
        const response = await fetch(RECEIVER, {
            method: 'POST',
            body: JSON.stringify(last.json),
        });
        result = await response.json();
    } catch {
        result = {
            saved: [],
            warnings: [],
            errors: [
                {
                    check: null,
                    message: `The receiver did not answer at ${RECEIVER}. Start it from UI/ with: node .storybook-ds/page-blocks/docs-skeleton/figma-export/receive.mjs`,
                    node: null,
                    canvas: null,
                },
            ],
        };
    }
    figma.ui.postMessage({ type: 'saved', ...result });
}

figma.showUI(__html__, { width: 440, height: 560, themeColors: true });

figma.ui.onmessage = async (message) => {
    if (message.type === 'selection') {
        canvasIds = readingOrder(figma.currentPage.selection).map(
            (node) => node.id,
        );
        await run();
    } else if (message.type === 'run') {
        await run();
    } else if (message.type === 'show') {
        await show(message.id);
    } else if (message.type === 'save') {
        await save();
    }
};

canvasIds = readingOrder(figma.currentPage.selection).map((node) => node.id);
run();
