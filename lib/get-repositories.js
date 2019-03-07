const fs = require('fs');
const { GITHUB_REPO_REGEX, extractOwnerAndRepo } = require('./github-helpers');

const getRepositories = limit => {
	const input = fs.readFileSync('/dev/stdin') || '';
	const inputRepositories = input.toString().split('\n');

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
