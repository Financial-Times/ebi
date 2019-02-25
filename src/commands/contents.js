/*eslint no-console: ["error", { allow: ["log", "error"] }] */
const getContents = require('../../lib/get-contents');
const getRepositories = require('../../lib/get-repositories');
const { withToken, withLimit } = require('./shared');

exports.command = 'contents <filepath> [search]';

exports.describe = 'Search within a repositories file';

exports.builder = yargs => {
	return withToken(withLimit(yargs))
		.positional('filepath', {
			type: 'string',
			describe: 'File path to search in GitHub contents API'
		})
		.positional('search', {
			type: 'string',
			describe: 'What to search for. If empty, returns all `engines`'
		});
};

exports.handler = argv => {
	const { filepath, token, search, limit } = argv;

	const repositories = getRepositories(limit);

	const getPathContents = getContents({
		githubToken: token,
		filepath
	});

	// get the contents of <filepath> for each repository
	const allRepos = repositories.map(repository =>
		getPathContents(repository)
			.then(contents => {
				const noSearch = !search;
				const containsSearchItem = contents.includes(search);

				if (noSearch || containsSearchItem) {
					return console.log(repository);
				} else {
					console.error(
						`INFO: '${filepath}' has no match for '${search}' in '${repository}'`
					);
				}
			})
			.catch(error => {
				console.error(error.message);
			})
	);

	return Promise.all(allRepos);
};
