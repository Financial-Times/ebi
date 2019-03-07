const fs = require('fs');
const { isArray } = require('lodash');

const getRepositories = ({ limit, repoList } = {}) => {
	const repoFormat = /^[^\/]+\/[^\/]+$/;
	let inputRepositories;

	const hasStdIn = !process.stdin.isTTY;

	if (isArray(repoList) && !!repoList.length && hasStdIn) {
		throw new Error(
			'choose either to pipe through a repo list OR pass it as args'
		);
	}

	if (hasStdIn) {
		const input = fs.readFileSync('/dev/stdin');
		inputRepositories = !!input ? input.toString().split('\n') : [];
	} else {
		inputRepositories = repoList;
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
