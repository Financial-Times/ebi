const fs = require('fs');

const getRepositories = limit => {
	const repositories = fs
		.readFileSync('/dev/stdin')
		.toString()
		.split('\n');

	return limit ? repositories.slice(0, limit) : repositories;
};

module.exports = getRepositories;
