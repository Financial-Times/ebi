const fs = require('fs');
const Octokit = require('@octokit/rest');

exports.command = 'contents [--token=<token>] <file> <search>'

exports.describe = 'search for a string within the repositories file'

exports.builder = yargs => {
    // TODO: this better
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
    repositories.forEach(async repository => {        
        try {
            const repoData = await octokit.repos.getContents({
                owner: 'Financial-Times', //TODO split this out of path
                repo: repository, //TODO split this out of path
                path: `/${argv.file}`, //?? this is a limitation
                file: argv.file
            })
            // TODO decode the data (from base64)?
        } catch (error) {
            console.log('error', error);
        }
        // search the file for the string <search>// print the repo name if there is a match
    });
}
