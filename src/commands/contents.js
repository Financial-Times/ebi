const fs = require('fs');

const getContents = require('../../lib/get-contents');

exports.command = 'contents <file> [search]';

exports.describe = 'Search within a repositories file';

exports.builder = yargs => {
	return yargs
		.positional('file', {
			type: 'string',
			describe: 'File path to search in GitHub contents API'
		})
		.positional('search', {
			type: 'string',
			describe:
				'What to search for. If empty, returns whether the file exists or not'
		})
		.option('token', {
			required: true,
			type: 'string',
			describe:
				'GitHub personal access token. Generate one from https://github.com/settings/tokens'
		});
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
				const noSearch = !search;
				const containsSearchItem = contents.includes(search);

				if (noSearch || containsSearchItem) {
					return console.log(repository);
				} else {
					console.error(
						`INFO: '${path}' has no match for '${search}' in '${repository}'`
					);
				}
			})
			.catch(error => {
				console.error(error.message);
			})
	);

	return Promise.all(allRepos);
};
