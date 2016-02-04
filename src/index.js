#!/usr/bin/env node

import {argv} from 'yargs';
import {diff} from 'deep-diff';
import {set} from 'object-path';
import {resolve} from 'path';

var {red, green} = require('colors');

const [prevPath, nextPath] = argv._;

var prevJson = require(resolve(prevPath));
var nextJson = require(resolve(nextPath));

var differences = diff(prevJson, nextJson);

function Diff(prev, next) {
    this.prev = prev;
    this.next = next;
}

var navigated = {};
var hasChanges = false;
differences.map(({path, lhs, rhs}) => {
    const lastKey = path[path.length - 1];
    if (lastKey !== 'version') {
        return;
    }
    var versionDiff = new Diff(lhs, rhs);
    set(navigated, path, versionDiff);
    hasChanges = true;
});

function printDiff(d, indent = 1) {
    const spaces = ' '.repeat(indent * 2 + 1);
    const spacesWithPlus = '+' + ' '.repeat(indent * 2);
    const spacesWithMinus = '-' + ' '.repeat(indent * 2);
    process.stdout.write('{\n');
    var keys = Object.keys(d);
    for (const index in keys) {
        const key = keys[index];
        const {prev, next} = d[key];
        const comma = (index < keys.length - 1) ? ',' : '';
        if (d[key] instanceof Diff) {
            process.stdout.write(red(`${spacesWithMinus}"${key}": ${prev}${comma}\n`));
            process.stdout.write(green(`${spacesWithPlus}"${key}": ${next}${comma}\n`));
        } else {
            process.stdout.write(`${spaces}"${key}": `);
            printDiff(d[key], indent + 1);
            process.stdout.write(`${spaces}}${comma}\n`);
        }
    }
}

printDiff(navigated);

if (argv['exit-code'] && hasChanges) {
    process.exit(1);
}
