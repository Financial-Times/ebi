const fs = require('fs');

const getContents = require('../../lib/get-contents');

exports.command = 'package <search>';
exports.desc = 'Search within the `package.json` file';

exports.builder = yargs => {
	return yargs
		.positional('search', {
			type: 'string',
			describe: 'What to search for'
		})
		.option('token', {
			required: true,
			type: 'string',
			describe:
				'GitHub personal access token. Generate one from https://github.com/settings/tokens'
		});
};

exports.handler = function(argv) {
	const { token, search } = argv;
	const repositories = fs
		.readFileSync('/dev/stdin')
		.toString()
		.split('\n');
	const path = 'package.json';

	const getPackageJson = getContents({
		githubToken: token,
		path
	});
	const allRepos = repositories.map(repository =>
		getPackageJson(repository)
			.then(contents => {
				if (contents.includes(search)) {
					console.log(repository);
				}
			})
			.catch(error => {
				console.error(error.message);
			})
	);

	return Promise.all(allRepos);
};
