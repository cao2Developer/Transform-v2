/* @jsxRuntime automatic */

/*
 * Code canvas (page block): DocsCode
 *
 * The structure and the Copy button of the code canvas. docs-code.css has
 * the look and the rest of the behavior (tabs, height, Expand). A doc page
 * passes a story:
 *
 *     <DocsCode of={Stories.States} />
 *
 * The story gives the tabs in parameters.code, a function of its args that
 * returns one { label, code } per tab, with HTML code. DocsCode reads the
 * current args of the story and follows them, as the Controls block does,
 * so the code changes with the controls.
 *
 * The code blocks are the SyntaxHighlighter of Storybook, the code block
 * inside the Source block: the Source block does not pass on
 * showLineNumbers. wrapLongLines is not used, because it breaks a line
 * into columns. codeProps lets long lines wrap and turns off the inline
 * styles of the line numbers, so docs-code.css draws them.
 *
 * The first line tells esbuild (Vite) to compile the JSX with the React 17+
 * runtime, as tsconfig does (react-jsx). The docs Storybook has no React
 * plugin, so without it the JSX would need React in scope.
 */

import { useContext, useEffect, useId, useState } from 'react';
import type { JSX } from 'react';
import { DocsContext, useOf } from '@storybook/addon-docs/blocks';
import { SyntaxHighlighter } from 'storybook/internal/components';
import { STORY_ARGS_UPDATED } from 'storybook/internal/core-events';
import type { Args } from 'storybook/internal/types';

// How long the check shows, the same as the Copy button of Storybook
const COPIED_TIME = 1500;

const codeProps = {
    className: 'docblock-source sb-unstyled',
    codeTagProps: { style: { whiteSpace: 'pre-wrap' as const } },
    lineNumberStyle: {
        minWidth: undefined,
        paddingRight: undefined,
        textAlign: undefined,
    },
    padded: true,
    showLineNumbers: true,
};

type Tab = { label: string; code: string };

type DocsCodeProps = { of: Parameters<typeof useOf>[0] };

export const DocsCode = ({ of }: DocsCodeProps): JSX.Element => {
    const { story } = useOf(of, ['story']);
    const context = useContext(DocsContext);
    // One radio group per code canvas, so two canvases on a page do not
    // share it
    const name = useId();
    const [current, setCurrent] = useState(0);
    const [copied, setCopied] = useState(false);
    const [args, setArgs] = useState<Args>(
        () => context.getStoryContext(story).args,
    );

    // The same event the Controls block listens to
    useEffect(() => {
        const update = (changed: { storyId: string; args: Args }): void => {
            if (changed.storyId === story.id) setArgs(changed.args);
        };
        context.channel.on(STORY_ARGS_UPDATED, update);
        return (): void => {
            context.channel.off(STORY_ARGS_UPDATED, update);
        };
    }, [story.id, context.channel]);

    const code = story.parameters.code as (args: Args) => Tab[];
    const tabs = code(args);

    useEffect(() => {
        if (!copied) return undefined;
        const timer = setTimeout(() => setCopied(false), COPIED_TIME);
        return (): void => clearTimeout(timer);
    }, [copied]);

    const copy = (): void => {
        navigator.clipboard
            .writeText(tabs[current].code)
            .then(() => setCopied(true))
            .catch(console.error);
    };

    return (
        <div className="docs-code sb-unstyled">
            <div className="docs-code-titlebar">
                <div
                    className="docs-code-tabs"
                    role="radiogroup"
                    aria-label="Code"
                >
                    {tabs.map((tab, index) => (
                        <label className="docs-code-tab" key={tab.label}>
                            <input
                                type="radio"
                                name={name}
                                checked={index === current}
                                onChange={(): void => setCurrent(index)}
                            />
                            {tab.label}
                        </label>
                    ))}
                </div>
                <div className="docs-code-actions">
                    <label className="docs-code-action" title="Expand">
                        <input type="checkbox" aria-label="Expand code" />
                        <span className="docs-code-icon docs-code-icon--expand-all" />
                        <span className="docs-code-icon docs-code-icon--collapse-all" />
                    </label>
                    <button
                        type="button"
                        className="docs-code-action docs-code-copy"
                        title="Copy"
                        aria-label={copied ? 'Copied' : 'Copy code'}
                        data-copied={copied || undefined}
                        onClick={copy}
                    >
                        <span className="docs-code-icon docs-code-icon--content-copy" />
                        <span className="docs-code-icon docs-code-icon--check" />
                    </button>
                </div>
            </div>
            <div className="docs-code-panels">
                {tabs.map((tab) => (
                    <div className="docs-code-panel" key={tab.label}>
                        <SyntaxHighlighter {...codeProps} language="html">
                            {tab.code}
                        </SyntaxHighlighter>
                    </div>
                ))}
            </div>
        </div>
    );
};
