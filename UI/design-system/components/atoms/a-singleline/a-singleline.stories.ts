import type { Meta, StoryObj } from '@storybook/html-vite';
import './a-singleline.css';

export type SinglelineArgs = {
    variant: 'default' | 'inline';
    answered: boolean;
    value: string;
    placeholder: string;
    align: 'start' | 'center' | 'end';
    readOnly: boolean;
    error: boolean;
};

export const defaultArgs: SinglelineArgs = {
    variant: 'default',
    answered: false,
    value: 'Answer',
    placeholder: 'Placeholder',
    align: 'start',
    readOnly: false,
    error: false,
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
    const value = args.answered ? args.value : '';
    const attrs = [
        `id="${id}"`,
        `type="text"`,
        `class="${classes.join(' ')}"`,
        `placeholder="${escapeHtml(args.placeholder)}"`,
        `value="${escapeHtml(value)}"`,
    ];
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

// The Docs page shows several canvases at once, so each story needs its own id.
function renderWith(id: string) {
    return (args: SinglelineArgs): string => docField(args, id);
}

const meta = {
    // The stories sit in the Playground group, after the doc pages.
    title: 'Atoms/Singleline/Playground',
    // Exports that start with a lowercase letter are helpers, not stories.
    excludeStories: /^[a-z]/,
    args: defaultArgs,
    argTypes: {
        variant: {
            name: 'Variant',
            description:
                'Default for forms. Inline for compact layouts and tables: bottom border only, 32px (`--size-lg`) high.',
            control: 'select',
            options: ['default', 'inline'],
        },
        answered: {
            name: 'Answered',
            description:
                'On: the field shows the value. Off: the field is empty and shows the placeholder.',
            control: 'boolean',
        },
        align: {
            name: 'Text alignment',
            description:
                'Set per question. Start and end follow the reading direction.',
            control: 'select',
            options: ['start', 'center', 'end'],
        },
        readOnly: {
            name: 'Read only',
            description:
                'The value can be focused, read and copied, but not changed. Never combined with Error.',
            control: 'boolean',
        },
        error: {
            name: 'Error',
            description:
                'After a submit with a missing or invalid value: red border, error icon and aria-invalid. Hidden while Read only is on.',
            control: 'boolean',
            if: { arg: 'readOnly', truthy: false },
        },
        value: {
            name: 'Value',
            description: 'The answer. Shown only when Answered is on.',
            control: 'text',
        },
        placeholder: {
            name: 'Placeholder',
            description: 'Hint shown while the field is empty.',
            control: 'text',
        },
    },
    parameters: {
        controls: { disable: true },
    },
    render: renderWith('a-singleline'),
} satisfies Meta<SinglelineArgs>;

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

// Overview section: the whole component with every control, Variant included.
// Shown only on the Docs page.
export const Overview: Story = {
    tags: ['!dev'],
    render: renderWith('a-singleline-overview'),
};

// Variants section: one field per variant, with no controls. Shown only on the Docs page.
export const VariantDefault: Story = {
    tags: ['!dev'],
    args: { variant: 'default' },
    render: renderWith('a-singleline-variant-default'),
};

export const VariantInline: Story = {
    tags: ['!dev'],
    args: { variant: 'inline' },
    render: renderWith('a-singleline-variant-inline'),
};

// States section: one field per variant, with the controls of the section.
// Shown only on the doc pages.
// State is an arg of these stories only. The pseudo-states addon reads parameters,
// not args, so Active puts the field inside the class that the addon uses to force
// :focus-visible on every element inside it.
type StatesArgs = SinglelineArgs & { state: 'inactive' | 'active' };

const stateArgType = {
    state: {
        name: 'State',
        description:
            'Active: the field has keyboard focus. Forced on this page.',
        control: 'select' as const,
        options: ['inactive', 'active'],
    },
};

function renderStates(id: string) {
    return (args: StatesArgs): string => {
        const input = docField(args, id);
        return args.state === 'active'
            ? `<div class="pseudo-focus-visible-all">${input}</div>`
            : input;
    };
}

export const StatesDefault: StoryObj<StatesArgs> = {
    tags: ['!dev'],
    args: { variant: 'default', answered: true, state: 'inactive' },
    argTypes: { ...fixedVariant, ...stateArgType },
    render: renderStates('a-singleline-states-default'),
};

export const StatesInline: StoryObj<StatesArgs> = {
    tags: ['!dev'],
    args: { variant: 'inline', answered: true, state: 'inactive' },
    argTypes: { ...fixedVariant, ...stateArgType },
    render: renderStates('a-singleline-states-inline'),
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
const shown = field(
    { ...defaultArgs, error: true, answered: true },
    'check-error',
);
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
