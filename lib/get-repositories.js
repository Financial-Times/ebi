const { GITHUB_REPO_REGEX, extractOwnerAndRepo } = require('./github-helpers');
const readStardardInputLines = require('./read-standard-input-lines');

const getRepositories = async ({ limit, repoList = [] } = {}) => {
	let inputRepositories;

	const hasStdIn = !process.stdin.isTTY;
	const stdinRepositories = hasStdIn ? await readStardardInputLines() : [];

	inputRepositories = repoList.concat(stdinRepositories);

	const errors = inputRepositories
		.map((githubRepoString, index) => {
			const hasRepository = !!githubRepoString;
			const formatError = !githubRepoString.match(GITHUB_REPO_REGEX);
			const line = index + 1;
			if (hasRepository && formatError) {
				return {
					repository: githubRepoString,
					line
				};
			}
		})
		.filter(error => !!error);
	const filteredRepositories = inputRepositories
		.filter(githubRepoString => !!githubRepoString.match(GITHUB_REPO_REGEX))
		.map(githubRepoString => {
			const { owner, repo } = extractOwnerAndRepo(githubRepoString);
			return `${owner}/${repo}`;
		});

	const repositoriesWithLimit = limit
		? filteredRepositories.slice(0, limit)
		: filteredRepositories;
	return {
		repositories: repositoriesWithLimit,
		errors
	};
};

module.exports = getRepositories;
