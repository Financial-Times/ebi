const fs = require('fs');
const Octokit = require('@octokit/rest');

exports.command = 'contents [--token=<token>] <file> <search>'

exports.describe = 'search for a string within the repositories file'

exports.builder = yargs => {
    // TODO: this
    return yargs;
}

exports.handler = argv => {
    /**
     * Financial-Times/next-front-page
     * Financial-Times/next-search-page
     */
    const repositories = fs.readFileSync('/dev/stdin').toString().split("\n");

    const octokit = new Octokit({
        auth: `token ${argv.token}`
    });

    // get the contents of <file> for each repository
    repositories.forEach(repository => {
        (await octokit.repos.getContents({
            file: argv.file
        })).data;

        // search the file for the string <search>// print the repo name if there is a match
        console.log('Hello world', input);
    });
}