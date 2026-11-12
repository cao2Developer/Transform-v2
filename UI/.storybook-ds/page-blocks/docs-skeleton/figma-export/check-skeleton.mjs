/* eslint-disable @typescript-eslint/explicit-function-return-type -- plain JavaScript, no type annotations */
// Checks the skeleton JSON files against the code: the states of the doc
// (content/states.md), the tokens (design-system/tokens/*.css)
// and the formulas. The receiver (receive.mjs) runs it before it writes a file.
// Run it alone from UI/ to check every file. It writes nothing:
//   node .storybook-ds/page-blocks/docs-skeleton/figma-export/check-skeleton.mjs
// Node.js only. Exit code 1 when a check fails.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const COMPONENTS = join('design-system', 'components');
const TOKENS = join('design-system', 'tokens');
const NAME = /^[a-z]+(-[a-z0-9]+)+$/;
const ROOT_PX = 16;

function folders(path) {
    return readdirSync(path, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);
}

/** The folder of a component, as a path from UI/, or null. */
export function componentFolder(ui, component) {
    if (!NAME.test(String(component))) return null;
    for (const level of folders(join(ui, COMPONENTS))) {
        const folder = join(COMPONENTS, level, component);
        if (existsSync(join(ui, folder))) return folder;
    }
    return null;
}

/** Token name to px, from the token files. The value is null when it is not a length. */
export function readTokens(ui) {
    const raw = new Map();
    for (const name of readdirSync(join(ui, TOKENS)).filter((n) =>
        n.endsWith('.css'),
    )) {
        const css = readFileSync(join(ui, TOKENS, name), 'utf8').replace(
            /\/\*[\s\S]*?\*\//g,
            '',
        );
        for (const [, token, value] of css.matchAll(
            /--([\w-]+)\s*:\s*([^;]+);/g,
        ))
            raw.set(token, value.trim());
    }
    const px = (token, depth) => {
        const value = raw.get(token);
        if (value === undefined || depth > 10) return null;
        const alias = /^var\(--([\w-]+)\)$/.exec(value);
        if (alias) return px(alias[1], depth + 1);
        if (value === '0') return 0;
        const length = /^(-?[\d.]+)(rem|px)$/.exec(value);
        return length
            ? Number(length[1]) * (length[2] === 'rem' ? ROOT_PX : 1)
            : null;
    };
    return new Map([...raw.keys()].map((token) => [token, px(token, 0)]));
}

/** The states of the doc: the ### titles of the States section. */
function readStates(ui, file) {
    if (!existsSync(join(ui, file))) return [];
    const text = readFileSync(join(ui, file), 'utf8');
    return [...text.matchAll(/^### (.+)$/gm)].map((match) => match[1].trim());
}

/**
 * Checks one skeleton file. Returns { file, errors, warnings }. `file` is the
 * path of the JSON from UI/, or null when the component has no folder.
 */
export function checkSkeleton(ui, data, tokens = readTokens(ui)) {
    const errors = [];
    const warnings = [];
    const seen = new Set();
    const error = (check, message, canvas = null) => {
        if (seen.has(message)) return;
        seen.add(message);
        errors.push({ check, message, node: null, canvas });
    };

    const component = data && data.component;
    const folder = componentFolder(ui, component);
    if (!folder) {
        error(
            2,
            `No folder for the component "${component}" in ${COMPONENTS}.`,
        );
        return { file: null, errors, warnings };
    }
    const statesFile = join(folder, 'content', 'states.md');
    const states = readStates(ui, statesFile);
    if (!states.length)
        error(
            2,
            `No states in ${statesFile}. It needs one ### title per state, for example "### Inactive".`,
        );

    // Check 16: the token exists in the code, with the same px as in Figma.
    const checkToken = (token, values, where, canvas) => {
        const px = tokens.get(token);
        if (!tokens.has(token))
            error(16, `${where}: --${token} is not in ${TOKENS}.`, canvas);
        else if (px === null)
            error(
                16,
                `${where}: --${token} is not a length in ${TOKENS}.`,
                canvas,
            );
        else
            for (const value of values)
                if (Math.abs(value - px) > 0.01)
                    error(
                        16,
                        `${where}: --${token} is ${px}px in the code and ${value}px in Figma.`,
                        canvas,
                    );
    };

    // Check 9: each term of a formula is a length token or a number, and the sum is the size.
    const checkFormula = (formula, size, where, canvas) => {
        const parts = formula.split(/\s+([+-])\s+/);
        let total = 0;
        for (let i = 0; i < parts.length; i += 2) {
            const sign = i === 0 || parts[i - 1] === '+' ? 1 : -1;
            const term = parts[i];
            const value = term.startsWith('--')
                ? tokens.get(term.slice(2))
                : Number(term);
            if (typeof value !== 'number' || Number.isNaN(value)) {
                error(
                    9,
                    `${where}: the formula term ${term} is not a length token in ${TOKENS}.`,
                    canvas,
                );
                return;
            }
            total += sign * value;
        }
        if (Math.abs(total - size) > 0.01)
            error(
                9,
                `${where}: the formula "${formula}" gives ${total}px, and the Space is ${size}px.`,
                canvas,
            );
    };

    for (const variant of data.variants || []) {
        const label = [component, variant.variant, variant.dir]
            .filter(Boolean)
            .join(' ');
        for (const group of variant.groups || []) {
            for (const state of group.states || [])
                if (states.length && !states.includes(state))
                    error(
                        2,
                        `${label}: the state "${state}" is not in ${statesFile} (${states.join(', ')}).`,
                        group.canvas,
                    );
            for (const layout of group.layouts || []) {
                for (const row of layout.rows || []) {
                    const where = `${label}, ${row.part} ${row.property}`;
                    if (row.token)
                        checkToken(row.token, row.px, where, group.canvas);
                    if (row.formula)
                        checkFormula(
                            row.formula,
                            row.px[0],
                            where,
                            group.canvas,
                        );
                }
                for (const mark of layout.marks || [])
                    if (mark.token)
                        checkToken(
                            mark.token,
                            [mark.size],
                            `${label}, ${mark.part} ${mark.property}`,
                            group.canvas,
                        );
            }
        }
    }

    // Warning 1: a state of the doc is in no canvas of a variant.
    for (const name of new Set((data.variants || []).map((v) => v.variant))) {
        const covered = new Set(
            data.variants
                .filter((v) => v.variant === name)
                .flatMap((v) => v.groups.flatMap((g) => g.states)),
        );
        for (const state of states)
            if (!covered.has(state))
                warnings.push({
                    check: 1,
                    message: `${[component, name].filter(Boolean).join(' ')}: the state "${state}" is in no canvas.`,
                    node: null,
                    canvas: null,
                });
    }

    return {
        file: join(folder, 'sections', 'skeleton.json'),
        errors,
        warnings,
    };
}

/** The lines of a result, for the terminal. */
export function report(result) {
    return [
        ...result.errors.map(
            (e) =>
                `  error${e.check ? ` (check ${e.check})` : ''}: ${e.message}`,
        ),
        ...result.warnings.map((w) => `  warning ${w.check}: ${w.message}`),
    ];
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    const ui = process.cwd();
    const log = (text) => process.stdout.write(`${text}\n`);
    if (!existsSync(join(ui, TOKENS))) {
        log(`Run it from UI/: ${TOKENS} is not here.`);
        process.exit(1);
    }
    const tokens = readTokens(ui);
    let files = 0;
    let failed = 0;
    for (const level of folders(join(ui, COMPONENTS)))
        for (const component of folders(join(ui, COMPONENTS, level))) {
            const file = join(
                COMPONENTS,
                level,
                component,
                'sections',
                'skeleton.json',
            );
            if (!existsSync(join(ui, file))) continue;
            files += 1;
            const result = checkSkeleton(
                ui,
                JSON.parse(readFileSync(join(ui, file), 'utf8')),
                tokens,
            );
            if (result.errors.length) failed += 1;
            log(`${result.errors.length ? 'FAIL' : 'ok  '}  ${file}`);
            for (const line of report(result)) log(line);
        }
    log(`${files} skeleton file(s), ${failed} with errors.`);
    process.exitCode = failed ? 1 : 0;
}
