/*eslint no-console: ["error", { allow: ["log", "error"] }] */
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
const { findMatchedKeyValuePairs } = require('../../lib/object-utils');

const {
	createResult,
	withMatch,
	withErrorMessage
} = require('../../lib/create-result');
const { logText, logTextWithSuffix, logJson } = require('../../lib/log-result');

exports.command = 'package:engines [search] [repo..]';
exports.desc = 'Search `engines` field inside the `package.json` file';

exports.builder = yargs => {
	const baseConfig = flow([
		withEpilogue,
		withJson,
		withRegex,
		withToken,
		withLimit,
		withRepoList
	]);
	return baseConfig(yargs).positional('search', {
		type: 'string',
		describe: 'What to search for. If empty, returns all `engines`'
	});
};

const processJson = content => {
	return JSON.parse(content);
};

// Report all engines in a tab separated format
// eg, "node@8.13.0  npm@6.8.0"
const enginesReport = engines => {
	return Object.keys(engines)
		.map(name => `${name}@${engines[name]}`)
		.join('\t');
};

const getJson = ({ filepath, repository }) => data => {
	try {
		return processJson(data);
	} catch (error) {
		throw new Error(
			`JSON PARSE ERROR: ${filepath} parse error in '${repository}'`
		);
	}
};

const throwIfNoEngines = ({ filepath, repository }) => (json = {}) => {
	const { engines } = json;
	if (!engines) {
		throw new Error(
			`INFO: engines field not found in '${filepath}' in '${repository}'`
		);
	}
	return engines;
};

const filterSearch = ({ search, regex }) => engines => {
	if (regex) {
		return findMatchedKeyValuePairs(engines, value => {
			return value.match(new RegExp(regex));
		});
	} else if (search) {
		return findMatchedKeyValuePairs(engines, value =>
			value.includes(search)
		);
	} else {
		return engines;
	}
};

exports.handler = async function(argv = {}) {
	const { token, limit, search, regex, json, repo } = argv;
	const filepath = 'package.json';
	const repoList = repo;
	const { errors, repositories } = await getRepositories({ limit, repoList });

	const getPackageJsonFile = getContents({
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

	const allRepos = repositories.map(repository => {
		const baseResult = {
			search,
			regex,
			filepath,
			repository
		};
		let result = createResult(baseResult);
		return getPackageJsonFile(repository)
			.then(fileContents => {
				result = createResult({ ...baseResult, fileContents });
				return fileContents;
			})
			.then(getJson({ filepath, repository }))
			.then(throwIfNoEngines({ filepath, repository }))
			.then(filterSearch({ search, regex }))
			.then(engines => {
				const hasEngines = !!Object.keys(engines).length;
				let output;
				if (hasEngines) {
					output = result(withMatch({ engines }));
				} else {
					output = result(
						withErrorMessage(
							`INFO: '${filepath}' has no match for '${regex ||
								search}' in '${repository}'`
						)
					);
				}

				return output;
			})
			.then(result => {
				if (json) {
					return logJson(result);
				} else {
					return logTextWithSuffix(({ engines }) =>
						enginesReport(engines)
					)(result);
				}
			})
			.catch(error => {
				const { message } = error;
				const output = result(withErrorMessage(message));
				return json ? logJson(output) : logText(output);
			});
	});

	return Promise.all(allRepos);
};
