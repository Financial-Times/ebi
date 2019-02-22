const Octokit = require('@octokit/rest').plugin(
	require('@octokit/plugin-throttling')
);

const getContents = ({ path, githubToken }) => {
	const octokit = new Octokit({
		auth: `token ${githubToken}`,
		throttle: {
			onRateLimit: (retryAfter, options) => {
				if (options.request.retryCount === 0) {
					// only retries once
					return true;
				}
			},
			onAbuseLimit: (retryAfter, options) => {
				throw new Error(
					`Abuse detected for request ${options.method} ${
						options.url
					}`
				);
			}
		}
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
