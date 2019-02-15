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
        const owner = repository.split('/')[0];
        const repo = repository.split('/')[1];

        try {
            const repoData = await octokit.repos.getContents({
                owner,
                repo,
                path: `${argv.file}`
            })

            // deal with case where path leads to a directory rather than a file
            if (repoData.data.type === 'dir') {
                throw new Error(`Incorrect value provided for <file>; the provided value '${argv.file}' is for a directory`)
            } else {
                const decodedContent = Buffer.from(repoData.data.content, 'base64').toString('utf8');

                if (decodedContent.includes(argv.search)){
                    console.log(repository);
                }
            }

        } catch (error) {
            if (error.status === 404) {
                console.error(`404 ERROR: file '${argv.file}' not found in '${repository}'`)
            } else {
                console.error('error', error);
            }
        }
    });
}
