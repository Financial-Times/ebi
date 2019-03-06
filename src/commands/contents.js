const { flow } = require('lodash');

const getContents = require('../../lib/get-contents');
const getRepositories = require('../../lib/get-repositories');
const {
	withEpilogue,
	withToken,
	withLimit,
	withRegex,
	withJson,
	withRepoList
} = require('./shared');
const {
	createResult,
	withMatchFileContents,
	withErrorMessage
} = require('../../lib/create-result');
const { logText, logJson } = require('../../lib/log-result');

exports.command = 'contents <filepath> [search] [repoList..]';

exports.describe = 'Search a file within a repository';

exports.builder = yargs => {
	const baseConfig = flow([
		withEpilogue,
		withJson,
		withRegex,
		withToken,
		withLimit,
		withRepoList
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

exports.handler = (argv = {}) => {
	const { filepath, token, search, regex, limit, json, repoList } = argv;

	const { errors, repositories } = getRepositories(limit, repoList);

	const getPathContents = getContents({
		githubToken: token,
		filepath
	});

	errors.forEach(error => {
		const { repository, line } = error;
		const result = createResult({
			search,
			regex,
			filepath,
			repository
		});
		const message = `ERROR: invalid repository '${repository}' on line ${line}`;
		const output = result(withErrorMessage(message));
		return json ? logJson(output) : logText(output);
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
