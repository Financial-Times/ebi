#!/usr/bin/env node

const { withEpilogue } = require('../src/commands/shared');

const yargs = require('yargs');

withEpilogue(yargs)
	.usage(
		`$0 [command]

Search files within GitHub repositories`
	)
	.commandDir('../src/commands').argv;
