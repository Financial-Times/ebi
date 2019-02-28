/*eslint no-console: ["error", { allow: ["log", "error"] }] */
const { flow } = require('lodash');

const getContents = require('../../lib/get-contents');
const getRepositories = require('../../lib/get-repositories');
const { withToken, withLimit, withRegex, withJson } = require('./shared');

const {
	createResult,
	withMatchFileContents,
	withErrorMessage
} = require('../../lib/create-result');
const { logText, logJson } = require('../../lib/log-result');

exports.command = 'package [search]';
exports.desc = 'Search within the `package.json` file';

exports.builder = yargs => {
	const baseConfig = flow([withJson, withRegex, withToken, withLimit]);
	return baseConfig(yargs).positional('search', {
		type: 'string',
		describe:
			'What to search for. If empty returns whether `package.json` exists or not'
	});
};

exports.handler = function(argv) {
	const { token, search, limit, regex, json } = argv;
	const repositories = getRepositories(limit);
	const filepath = 'package.json';

	const getPackageJson = getContents({
		githubToken: token,
		filepath
	});
	const allRepos = repositories.map(repository => {
		const result = createResult({
			search,
			regex,
			filepath,
			repository
		});
		return getPackageJson(repository)
			.then(contents => {
				const noSearch = !search;
				const containsSearchItem = contents.includes(search);
				let output;

				if (regex) {
					const regExp = new RegExp(regex);
					const hasMatch = contents.match(regExp);

					if (hasMatch) {
						output = result(withMatchFileContents(contents));
					} else {
						output = result(
							withErrorMessage(
								`INFO: '${filepath}' has no match for '${regExp}' in '${repository}'`
							)
						);
					}
				} else if (noSearch || containsSearchItem) {
					output = result(withMatchFileContents(contents));
				} else {
					output = result(
						withErrorMessage(
							`INFO: '${filepath}' has no match for '${search}' in '${repository}'`
						)
					);
				}

				return output;
			})
			.then(result => (json ? logJson(result) : logText(result)))
			.catch(error => {
				const { message } = error;
				const output = result(withErrorMessage(message));
				return json ? logJson(output) : logText(output);
			});
	});

	return Promise.all(allRepos);
};
