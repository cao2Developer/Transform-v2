import type { Meta, StoryObj } from '@storybook/html-vite';
import './a-singleline.css';

export type SinglelineArgs = {
    variant: 'default' | 'inline';
    value: string;
    placeholder: string;
    align: 'start' | 'center' | 'end';
    readOnly: boolean;
    error: boolean;
    width: number;
    maxLength?: number;
};

export const defaultArgs: SinglelineArgs = {
    variant: 'default',
    value: '',
    placeholder: 'Placeholder',
    align: 'start',
    readOnly: false,
    error: false,
    width: 200,
};

// How the field is named and described by other elements.
export type SinglelineLinks = {
    describedBy?: string;
    labelledBy?: string;
};

function escapeHtml(value: string): string {
    return value.replace(/[&<>"]/g, (char) => {
        if (char === '&') return '&amp;';
        if (char === '<') return '&lt;';
        if (char === '>') return '&gt;';
        return '&quot;';
    });
}

// Read only and error never combine. Read only wins.
function showsError(args: SinglelineArgs): boolean {
    return args.error && !args.readOnly;
}

// The atom alone: one <input>. Parent components call this.
// describedBy points at the error message, and only applies in the error state.
// labelledBy names the field when there is no <label> (for example, a table cell).
export function singleline(
    args: SinglelineArgs,
    id: string,
    links: SinglelineLinks = {},
): string {
    const error = showsError(args);
    const classes = ['a-singleline'];
    if (args.variant === 'inline') classes.push('a-singleline--inline');
    if (args.align === 'center') classes.push('a-singleline--align-center');
    if (args.align === 'end') classes.push('a-singleline--align-end');
    const attrs = [
        `id="${id}"`,
        `type="text"`,
        `class="${classes.join(' ')}"`,
        `placeholder="${escapeHtml(args.placeholder)}"`,
        `value="${escapeHtml(args.value)}"`,
    ];
    // The default width comes from the CSS, so only another width is written.
    const width = Number(args.width);
    if (width > 0 && width !== defaultArgs.width)
        attrs.push(`style="width: ${width}px"`);
    const maxLength = Number(args.maxLength);
    if (maxLength > 0) attrs.push(`maxlength="${maxLength}"`);
    if (links.labelledBy) attrs.push(`aria-labelledby="${links.labelledBy}"`);
    if (args.readOnly) attrs.push('readonly');
    if (error) {
        attrs.push('aria-invalid="true"');
        if (links.describedBy)
            attrs.push(`aria-describedby="${links.describedBy}"`);
    }
    return `<input ${attrs.join(' ')}>`;
}

// A field in context: a label, the atom and the error message.
// The self-check uses this.
function field(args: SinglelineArgs, id: string): string {
    const messageId = `${id}-error`;
    const error = showsError(args);
    const message = error
        ? `\n  <p class="a-singleline-message" id="${messageId}">Enter a valid answer.</p>`
        : '';
    return `<div class="a-singleline-demo">
  <label for="${id}">Answer</label>
  ${singleline(args, id, error ? { describedBy: messageId } : {})}${message}
</div>`;
}

// The atom alone, for the canvases of the doc pages: no label and no message.
// A hidden name keeps the field named for screen readers.
function docField(args: SinglelineArgs, id: string): string {
    const nameId = `${id}-name`;
    return `<span id="${nameId}" hidden>Answer</span>
${singleline(args, id, { labelledBy: nameId })}`;
}

// The Summary page shows several canvases at once, so each story needs its own id.
function renderWith(id: string) {
    return (args: SinglelineArgs): string => docField(args, id);
}

// The States stories have one more arg: Active, the keyboard focus on every
// cell. It is the first arg of the meta, because the Controls block lists the
// controls in the order of the args: Active is the first control of States.
type StatesArgs = SinglelineArgs & { active: boolean };

const meta = {
    // The stories sit in the Playground group, after the doc pages.
    title: 'Atoms/Singleline/Playground',
    // Exports that start with a lowercase letter are helpers, not stories.
    excludeStories: /^[a-z]/,
    args: { active: false, ...defaultArgs },
    argTypes: {
        active: {
            name: 'Active',
            control: 'boolean',
            // Hidden here. Only the States stories show it (showActive).
            table: { disable: true },
        },
        variant: {
            name: 'Variant',
            control: 'select',
            options: ['default', 'inline'],
        },
        align: {
            name: 'Text alignment',
            control: 'select',
            options: ['start', 'center', 'end'],
            table: { defaultValue: { summary: 'start' } },
        },
        readOnly: {
            name: 'Read only',
            control: 'boolean',
            table: { defaultValue: { summary: 'false' } },
        },
        error: {
            name: 'Error',
            control: 'boolean',
            // Read only and error never combine.
            if: { arg: 'readOnly', truthy: false },
            table: { defaultValue: { summary: 'false' } },
        },
        value: {
            name: 'Value',
            control: 'text',
        },
        placeholder: {
            name: 'Placeholder',
            control: 'text',
        },
        width: {
            name: 'Width',
            control: { type: 'number', step: 10 },
            table: { defaultValue: { summary: '200' } },
        },
        maxLength: {
            name: 'Max length',
            control: 'number',
        },
    },
    parameters: {
        controls: { disable: true },
    },
    render: renderWith('a-singleline'),
} satisfies Meta<StatesArgs>;

export default meta;

type Story = StoryObj<SinglelineArgs>;

// Each story has one variant, so the Variant control is hidden.
const fixedVariant = { variant: { table: { disable: true } } };

// Playground: one story per variant, with every other control. Shown in the sidebar.
export const Default: Story = {
    args: { variant: 'default' },
    argTypes: fixedVariant,
    parameters: { controls: { disable: false } },
    render: renderWith('a-singleline-default'),
};

export const Inline: Story = {
    args: { variant: 'inline' },
    argTypes: fixedVariant,
    parameters: { controls: { disable: false } },
    render: renderWith('a-singleline-inline'),
};

// The cells canvas of the Variations and States sections: one cell per variant
// and state, each with its name at the top left, and the same args in every
// cell, so one Controls block changes all of them. The docs-cells classes come
// from the page block of the same name, which the docs Storybook loads on every
// page. id keeps the ids of each section apart.
const variations: SinglelineArgs['variant'][] = ['default', 'inline'];

const variantNames = { default: 'Default', inline: 'Inline' };

// One row of cells, one cell per variant: the state the row shows (none in
// Variations) and the args it changes.
type Row = { state?: string; args?: Partial<SinglelineArgs> };

// Variations: one row, named by the variant only.
const variationRows: Row[] = [{}];

// States: Inactive, Error and Read only, in the order of the notes. Active is
// a control, so it combines with each of them.
const stateRows: Row[] = [
    { state: 'Inactive' },
    { state: 'Error', args: { error: true } },
    { state: 'Read only', args: { readOnly: true } },
];

// The States stories show the Active control, hidden in the meta. The name is
// repeated: without it, Storybook names the argType by its key ("active"), and
// include no longer finds "Active".
const showActive = {
    active: {
        name: 'Active',
        table: { disable: false, defaultValue: { summary: 'false' } },
    },
};

// A field in a States cell is static: out of the tab order here, and out of
// reach of the mouse with docs-cells--static. A real focus would mix with the
// Active control.
function staticField(args: SinglelineArgs, id: string): string {
    return docField(args, id).replace('<input ', '<input tabindex="-1" ');
}

function cells(
    args: SinglelineArgs & { active?: boolean },
    id: string,
    variants: SinglelineArgs['variant'][],
    rows: Row[],
): string {
    // Rows with a state are States, so their cells are static. Variations
    // stays interactive.
    const states = rows.some((row) => row.state);
    const field = states ? staticField : docField;
    const items = rows.flatMap((row, index) =>
        variants.map((variant) => {
            const name = row.state
                ? `${variantNames[variant]} <span class="docs-cells-separator" aria-hidden="true">·</span> ${row.state}`
                : variantNames[variant];
            return `<div class="docs-cells-item">
  <p class="docs-cells-label">${name}</p>
  <div class="docs-cells-stage">
    ${field({ ...args, ...row.args, variant }, `${id}-${index}-${variant}`)}
  </div>
</div>`;
        }),
    );
    const classes = ['docs-cells', 'sb-unstyled'];
    if (states) classes.push('docs-cells--static');
    // The pseudo-states addon reads parameters, not args. So Active puts the
    // cells inside the class that the addon uses to force :focus-visible on
    // every element inside it.
    if (args.active) classes.push('pseudo-focus-visible-all');
    return `<div class="${classes.join(' ')}" style="--docs-cells-columns: ${variants.length}">
${items.join('\n')}
</div>`;
}

// The cells fill the canvas, with no padding around them.
const fullscreen = { layout: 'fullscreen' };

// The Variations story has one more arg: State, one of the states of the
// States section, set on every cell.
type VariationsArgs = SinglelineArgs & { state?: string };

function withState(args: VariationsArgs): VariationsArgs {
    const row = stateRows.find((item) => item.state === args.state);
    return { ...args, ...row?.args };
}

// Variations section. Shown only on the Summary and Common pages. Its
// Controls block has only State.
export const Variations: StoryObj<VariationsArgs> = {
    tags: ['!dev'],
    args: { state: 'Inactive' },
    argTypes: {
        ...fixedVariant,
        state: {
            name: 'State',
            control: 'select',
            options: stateRows.map((row) => row.state),
            table: { defaultValue: { summary: 'Inactive' } },
        },
    },
    parameters: fullscreen,
    render: (args) =>
        cells(
            withState(args),
            'a-singleline-variations',
            variations,
            variationRows,
        ),
};

// Attributes section. Shown only on the Summary and Common pages: the same
// cells as Variations, in the inactive state, with the attribute controls.
export const Attributes: Story = {
    tags: ['!dev'],
    argTypes: fixedVariant,
    parameters: fullscreen,
    render: (args) =>
        cells(args, 'a-singleline-attributes', variations, variationRows),
};

// States section. Shown only on the doc pages: States has both variants
// (Summary page), and StatesDefault and StatesInline have one variant each
// (variant pages). The rows set Error and Read only, so the controls of the
// section change only what every cell shares, and Active.
export const States: StoryObj<StatesArgs> = {
    tags: ['!dev'],
    args: { value: 'Answer' },
    argTypes: { ...fixedVariant, ...showActive },
    parameters: fullscreen,
    render: (args) => cells(args, 'a-singleline-states', variations, stateRows),
};

export const StatesDefault: StoryObj<StatesArgs> = {
    tags: ['!dev'],
    args: { value: 'Answer' },
    argTypes: { ...fixedVariant, ...showActive },
    parameters: fullscreen,
    render: (args) =>
        cells(args, 'a-singleline-states-default', ['default'], stateRows),
};

export const StatesInline: StoryObj<StatesArgs> = {
    tags: ['!dev'],
    args: { value: 'Answer' },
    argTypes: { ...fixedVariant, ...showActive },
    parameters: fullscreen,
    render: (args) =>
        cells(args, 'a-singleline-states-inline', ['inline'], stateRows),
};
// Self-check: throws if a rule of this component breaks.
const leaked = field(
    { ...defaultArgs, readOnly: true, error: true },
    'check-readonly',
);
if (
    leaked.includes('aria-invalid') ||
    leaked.includes('Enter a valid answer.')
) {
    throw new Error('read only and error were combined');
}
const shown = field({ ...defaultArgs, error: true }, 'check-error');
if (
    !shown.includes('aria-invalid="true"') ||
    !shown.includes('aria-describedby="check-error-error"')
) {
    throw new Error('error state is missing its message');
}
const alone = docField({ ...defaultArgs, error: true }, 'check-doc');
if (
    alone.includes('<label') ||
    alone.includes('Enter a valid answer.') ||
    !alone.includes('aria-labelledby="check-doc-name"')
) {
    throw new Error('a doc canvas field has a label, a message or no name');
}

if (singleline(defaultArgs, 'check-width').includes('style=')) {
    throw new Error('the default width is written in the HTML');
}
const stateFields = cells(defaultArgs, 'check-cells', variations, stateRows)
    .split('<input ')
    .slice(1);
if (
    stateFields.length !== variations.length * stateRows.length ||
    stateFields.some(
        (input) =>
            !input.startsWith('tabindex="-1"') ||
            (input.includes('readonly') && input.includes('aria-invalid')),
    )
) {
    throw new Error(
        'a States cell is missing, can be focused, or combines read only and error',
    );
}

const variationCells = cells(
    defaultArgs,
    'check-variations',
    variations,
    variationRows,
);
if (variationCells.includes('tabindex')) {
    throw new Error('a Variations cell cannot be focused');
}

const readOnlyState = withState({ ...defaultArgs, state: 'Read only' });
if (!readOnlyState.readOnly || readOnlyState.error) {
    throw new Error('the State control of Variations does not set read only');
}

if (
    !singleline({ ...defaultArgs, maxLength: 3 }, 'check-max').includes(
        'maxlength="3"',
    ) ||
    singleline(defaultArgs, 'check-no-max').includes('maxlength')
) {
    throw new Error('max length is missing, or written with no value');
}
