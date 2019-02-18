const Octokit = require('@octokit/rest');

const getContents = ({ path, githubToken }) => {
    const octokit = new Octokit({
        auth: `token ${githubToken}`
    });

    return async (repository) => {
        const owner = repository.split('/')[0];
        const repo = repository.split('/')[1];

        try {
            const repoData = await octokit.repos.getContents({
                owner,
                repo,
                path
            })

            // deal with case where path leads to a directory rather than a file
            if (repoData.data.type === 'dir') {
                throw new Error(`Incorrect value provided for <file>; the provided value '${argv.file}' is for a directory`)
            } else {
                const decodedContent = Buffer.from(repoData.data.content, 'base64').toString('utf8');

                return decodedContent;
            }
        } catch (error) {
            if (error.status === 404) {
                console.error(`404 ERROR: file '${argv.file}' not found in '${repository}'`)
            } else {
                console.error('error', error);
            }
        }
    };
};

module.exports = getContents;
