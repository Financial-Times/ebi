const fs = require('fs');

const getContents = require('../../lib/get-contents');

exports.command = 'contents [--token=<token>] <file> <search>';

exports.describe = 'search for a string within the repositories file';

exports.builder = yargs => {
	// TODO: this better
	return yargs;
};

exports.handler = argv => {
	const { file: path, token, search } = argv;
	const repositories = fs
		.readFileSync('/dev/stdin')
		.toString()
		.split('\n');

	const getPathContents = getContents({
		githubToken: token,
		path
	});

	// get the contents of <file> for each repository
	const allRepos = repositories.map(repository =>
		getPathContents(repository)
			.then(contents => {
				if (contents.includes(search)) {
					console.log(repository);
				}
			})
			.catch(error => {
				console.error(error);
			})
	);

	return Promise.all(allRepos);
};
