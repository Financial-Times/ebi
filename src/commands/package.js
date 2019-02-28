/*eslint no-console: ["error", { allow: ["log", "error"] }] */
const getContents = require('../../lib/get-contents');
const getRepositories = require('../../lib/get-repositories');
const { withToken, withLimit, withRegex } = require('./shared');

exports.command = 'package [search]';
exports.desc = 'Search within the `package.json` file';

exports.builder = yargs => {
	return withRegex(withToken(withLimit(yargs))).positional('search', {
		type: 'string',
		describe:
			'What to search for. If empty returns whether `package.json` exists or not'
	});
};

exports.handler = function(argv) {
	const { token, search, limit, regex } = argv;
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

				if (regex) {
					const regExp = new RegExp(regex);
					const hasMatch = contents.match(regExp);

					if (hasMatch) {
						return console.log(repository);
					} else {
						console.error(
							`INFO: '${filepath}' has no match for '${regExp}' in '${repository}'`
						);
					}
				} else if (noSearch || containsSearchItem) {
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
