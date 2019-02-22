const fs = require('fs');

const getRepositories = limit => {
	const input = fs.readFileSync('/dev/stdin') || '';
	const repositories = input
		.toString()
		.split('\n')
		.filter(repo => !!repo);

	return limit ? repositories.slice(0, limit) : repositories;
};

module.exports = getRepositories;
