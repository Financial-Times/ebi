const fs = require('fs');

const getRepositories = ({ limit, repoList } = {}) => {
	const repoFormat = /^[^\/]+\/[^\/]+$/;
	let inputRepositories;
	const input = fs.readFileSync('/dev/stdin');

	if (repoList && input) {
		throw new Error(
			'choose either to pipe through a repo list OR pass it as args'
		);
	}

	if (repoList) {
		inputRepositories = repoList;
	} else {
		inputRepositories = !!input ? input.toString().split('\n') : [];
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
