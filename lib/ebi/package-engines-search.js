const getRepositories = require('../../lib/get-repositories');
const getContents = require('../../lib/get-contents');
const { createResult, withErrorMessage } = require('../../lib/create-result');
const { getEbiResults } = require('./ebi-results');

const { findMatchedKeyValuePairs } = require('../../lib/object-utils');

const { withMatch, withNoMatchMessage } = require('../../lib/create-result');

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
	const engines = json.engines || json.volta;
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

/**
 * @typedef {import('./ebi-results').EbiResultsObject} EbiResultsObject
 */

/**
 * Search configuration
 *
 * @typedef {Object} Config
 * @property {string} [token] GitHub API token
 * @property {string} [search] Search string
 * @property {string} [regex] Regular expression for searching. Overrides `search` property
 * @property {number} [limit] Limit the number of repositories to search for
 */

/**
 * Search the contents of the `engines` field in the `package.json` file in GitHub repositories
 *
 * @param {Config} [config={}]
 * @returns {(repoList: string[]) => EbiResultsObject)}
 */
exports.packageEnginesSearch = ({
	token,
	limit,
	search,
	regex
} = {}) => async repoList => {
	const { errors, repositories } = await getRepositories({ limit, repoList });
	const filepath = 'package.json';

	const getPackageJsonFile = getContents({
		githubToken: token,
		filepath
	});

	const searchResults = repositories.map(repository => {
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
					output = result(
						withMatch({
							engines,
							textSuffix: enginesReport(engines)
						})
					);
				} else {
					output = result(
						withNoMatchMessage(
							`INFO: '${filepath}' has no match for '${regex ||
								search}' in '${repository}'`
						)
					);
				}

				return output;
			})
			.catch(error => {
				const { message } = error;
				const output = result(withErrorMessage(message));
				return Promise.reject(output);
			});
	});

	return getEbiResults({
		errors,
		search,
		regex,
		filepath,
		searchResults
	});
};
