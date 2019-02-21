/*eslint no-console: ["error", { allow: ["log", "error"] }] */
const getContents = require('../../lib/get-contents');
const getRepositories = require('../../lib/get-repositories');

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
		})
		.option('limit', {
			required: false,
			type: 'number',
			describe: 'limit the number of repositories to search for'
		});
};

exports.handler = argv => {
	const { file: path, token, search, limit } = argv;

	const repositories = getRepositories(limit);

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
