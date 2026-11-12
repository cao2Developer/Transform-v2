/* eslint-disable @typescript-eslint/explicit-function-return-type -- plain JavaScript, no type annotations */
// Local receiver of the Docs skeleton export plugin. It takes the JSON from
// the plugin, checks it against the code (check-skeleton.mjs) and, only when
// there are no errors, writes sections/skeleton.json in the folder
// of each component, formatted with the prettier of UI/. It listens on
// 127.0.0.1 only. Run it from UI/, and stop it with Ctrl+C:
//   node .storybook-ds/page-blocks/docs-skeleton/figma-export/receive.mjs
// To test without writing in the component folders, add: --out <folder>
// Node.js only, nothing to install.

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { basename, dirname, join, resolve } from 'node:path';
import { checkSkeleton, readTokens, report } from './check-skeleton.mjs';

const PORT = 6008;
const MAX_BYTES = 5000000;
const ui = process.cwd();
const outIndex = process.argv.indexOf('--out');
const out =
    outIndex > 0 && process.argv[outIndex + 1]
        ? resolve(process.argv[outIndex + 1])
        : null;
const log = (text) => process.stdout.write(`${text}\n`);

if (!existsSync(join(ui, 'design-system', 'tokens'))) {
    log('Run the receiver from UI/: design-system/tokens is not here.');
    process.exit(1);
}
const prettier = createRequire(join(ui, 'package.json'))('prettier');

/** Checks every file and writes them only when no file has an error. */
async function receive(body) {
    const files = JSON.parse(body);
    if (!Array.isArray(files))
        throw new Error('expected a list of skeleton files');
    const tokens = readTokens(ui);
    const checked = files.map((data) => checkSkeleton(ui, data, tokens));
    const result = {
        saved: [],
        errors: checked.flatMap((item) => item.errors),
        warnings: checked.flatMap((item) => item.warnings),
    };
    for (const item of checked) for (const line of report(item)) log(line);
    if (result.errors.length) {
        log('Nothing saved: fix the errors and export again.');
        return result;
    }
    for (const [i, item] of checked.entries()) {
        const target = out
            ? join(out, basename(item.file))
            : join(ui, item.file);
        const options = {
            ...(await prettier.resolveConfig(join(ui, item.file))),
            parser: 'json',
        };
        mkdirSync(dirname(target), { recursive: true });
        writeFileSync(
            target,
            await prettier.format(JSON.stringify(files[i]), options),
        );
        result.saved.push(out ? target : item.file);
        log(`Saved ${out ? target : item.file}`);
    }
    return result;
}

const server = createServer(async (request, response) => {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (request.method === 'OPTIONS') return response.end();
    if (request.method !== 'POST' || request.url !== '/skeleton') {
        response.statusCode = 404;
        return response.end();
    }
    let body = '';
    for await (const chunk of request) {
        body += chunk;
        if (body.length > MAX_BYTES) {
            response.statusCode = 413;
            return response.end();
        }
    }
    let result;
    try {
        result = await receive(body);
    } catch (err) {
        const message = `The receiver could not read the export: ${err.message}`;
        log(message);
        result = {
            saved: [],
            warnings: [],
            errors: [{ check: null, message, node: null, canvas: null }],
        };
    }
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify(result));
});

server.on('error', (err) => {
    log(
        err.code === 'EADDRINUSE'
            ? `Port ${PORT} is in use. Is the receiver already running?`
            : err.message,
    );
    process.exit(1);
});

server.listen(PORT, '127.0.0.1', () => {
    log(
        `Waiting for the plugin on http://localhost:${PORT}${out ? `, test mode: files go to ${out}` : ''}. Stop with Ctrl+C.`,
    );
});
