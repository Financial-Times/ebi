const Octokit = require('@octokit/rest');

const getContents = ({ path, githubToken }) => {
	const octokit = new Octokit({
		auth: `token ${githubToken}`
	});

	return async repository => {
		const owner = repository.split('/')[0];
		const repo = repository.split('/')[1];

		try {
			const repoData = await octokit.repos.getContents({
				owner,
				repo,
				path
			});

			// deal with case where path leads to a directory rather than a file
			if (repoData.data.path !== path) {
				throw new Error(
					`Incorrect value provided for <file>; '${path}' is not a file path`
				);
			} else {
				const decodedContent = Buffer.from(
					repoData.data.content,
					'base64'
				).toString('utf8');

				return decodedContent;
			}
		} catch (error) {
			if (error.status === 404) {
				throw new Error(
					`404 ERROR: file '${path}' not found in '${repository}'`
				);
			} else {
				throw error;
			}
		}
	};
};

module.exports = getContents;
