#!/usr/bin/env node

const contentsCommand = require('../src/commands/contents');

require('yargs')
  .command(contentsCommand)
  .argv;