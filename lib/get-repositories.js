const fs = require('fs');

const getRepositories = ({ limit, repoList }) => {
	const repoFormat = /^[^\/]+\/[^\/]+$/;
	let inputRepositories;

	if (repoList) {
		inputRepositories = repoList;
	} else {
		const input = fs.readFileSync('/dev/stdin') || '';
		inputRepositories = input.toString().split('\n');
	}

	const errors = inputRepositories
		.map((repository, index) => {
			const hasRepository = !!repository;
			const formatError = !repository.match(repoFormat);
			const line = index + 1;
			if (hasRepository && formatError) {
				return {
					repository,
					line
				};
			}
		})
		.filter(error => !!error);
	const filteredRepositories = inputRepositories.filter(
		repo => !!repo.match(repoFormat)
	);

	const repositoriesWithLimit = limit
		? filteredRepositories.slice(0, limit)
		: filteredRepositories;
	return {
		repositories: repositoriesWithLimit,
		errors
	};
};

module.exports = getRepositories;
