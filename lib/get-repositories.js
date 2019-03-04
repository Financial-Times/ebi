const fs = require('fs');

const getRepositories = limit => {
	const input = fs.readFileSync('/dev/stdin') || '';
	const repositories = input
		.toString()
		.split('\n')
		.filter(repo => !!repo);

	const repositoriesWithLimit = limit
		? repositories.slice(0, limit)
		: repositories;
	return {
		repositories: repositoriesWithLimit
	};
};

module.exports = getRepositories;
