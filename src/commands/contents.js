const { flow } = require('lodash');

const getContents = require('../../lib/get-contents');
const getRepositories = require('../../lib/get-repositories');
const {
	withEpilogue,
	withToken,
	withLimit,
	withRegex,
	withJson
} = require('./shared');
const {
	createResult,
	withMatchFileContents,
	withErrorMessage
} = require('../../lib/create-result');
const { logText, logJson } = require('../../lib/log-result');

exports.command = 'contents <filepath> [search]';

exports.describe = 'Search a file within a repository';

exports.builder = yargs => {
	const baseConfig = flow([
		withEpilogue,
		withJson,
		withRegex,
		withToken,
		withLimit
	]);
	return baseConfig(yargs)
		.positional('filepath', {
			type: 'string',
			describe: 'File path to search in GitHub contents API'
		})
		.positional('search', {
			type: 'string',
			describe:
				'What to search for. If empty, returns whether the file exists or not'
		});
};

exports.handler = argv => {
	const { filepath, token, search, regex, limit, json } = argv;

	const repositories = getRepositories(limit);

	const getPathContents = getContents({
		githubToken: token,
		filepath
	});

	// get the contents of <filepath> for each repository
	const allRepos = repositories.map(repository => {
		const result = createResult({
			search,
			regex,
			filepath,
			repository
		});
		return getPathContents(repository)
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
