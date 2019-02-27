/*eslint no-console: ["error", { allow: ["log", "error"] }] */
const getContents = require('../../lib/get-contents');
const getRepositories = require('../../lib/get-repositories');
const { withToken, withLimit } = require('./shared');

exports.command = 'package [search]';
exports.desc = 'Search within the `package.json` file';

exports.builder = yargs => {
	return withToken(withLimit(yargs)).positional('search', {
		type: 'string',
		describe: 'What to search for'
	});
};

exports.handler = function(argv) {
	const { token, search, limit } = argv;
	const repositories = getRepositories(limit);
	const filepath = 'package.json';

	const getPackageJson = getContents({
		githubToken: token,
		filepath
	});
	const allRepos = repositories.map(repository =>
		getPackageJson(repository)
			.then(contents => {
				const noSearch = !search;
				const containsSearchItem = contents.includes(search);

				if (noSearch || containsSearchItem) {
					return console.log(repository);
				} else {
					return console.error(
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
