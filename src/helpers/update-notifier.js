#!/usr/bin/env node
const updateNotifier = require('update-notifier');
/**
 * Display a notification if a newer version of this package is available to install.
 *
 * This check for updates to the `@financial-times/ebi` package
 * happens asynchronously in a detached child process that runs
 * independently from the parent CLI process. This ensures that
 * the check for updates doesn't interfere with the running of the
 * CLI itself. If an update is available, the user won't be notified
 * about it until the next time that they run the CLI.
 *
 * Note: `update-notifier` checks for updates once a day by default.
 *
 * @see https://www.npmjs.com/package/update-notifier
 */
const packageJson = require('../package.json');
updateNotifier({ pkg: packageJson }).notify();
