/* @jsxRuntime automatic */

/*
 * Code canvas (page block): DocsCode
 *
 * The structure and the Copy button of the code canvas. docs-code.css has
 * the look and the rest of the behavior (tabs, height, Expand). A doc page
 * shows the HTML and the CSS of a component:
 *
 *     <DocsCode html={...} css={css} />
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

import { useEffect, useId, useState } from 'react';
import type { JSX } from 'react';
import { SyntaxHighlighter } from 'storybook/internal/components';

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

type Tab = { label: string; language: 'html' | 'css'; code: string };

type DocsCodeProps = { html: string; css: string };

export const DocsCode = ({ html, css }: DocsCodeProps): JSX.Element => {
    // One radio group per code canvas, so two canvases on a page do not
    // share it
    const name = useId();
    const [current, setCurrent] = useState(0);
    const [copied, setCopied] = useState(false);

    const tabs: Tab[] = [
        { label: 'HTML', language: 'html', code: html },
        { label: 'CSS', language: 'css', code: css },
    ];

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
                        <SyntaxHighlighter
                            {...codeProps}
                            language={tab.language}
                        >
                            {tab.code}
                        </SyntaxHighlighter>
                    </div>
                ))}
            </div>
        </div>
    );
};
