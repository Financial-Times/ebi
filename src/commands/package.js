/*eslint no-console: ["error", { allow: ["log", "error"] }] */
const getContents = require('../../lib/get-contents');
const getRepositories = require('../../lib/get-repositories');
const { withToken, withLimit } = require('./shared');

exports.command = 'package <search>';
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
