#!/usr/bin/env node
process.removeAllListeners('warning');
import program from './index.js';

program.parse(process.argv);