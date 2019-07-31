const { createResult, withErrorMessage } = require('../../lib/create-result');

/**
 * Ebi result
 *
 * @typedef {Object} EbiResult
 * @property {'match'|'no-match'|'error'} type Type of result
 * @property {string} repository Full repository path
 * @property {string} filepath The filepath searched for
 * @property {string} fileContents The file contents serialized as a string
 * @property {string} [search] The search term
 * @property {string} [regex] The regex used for search
 * @property {string} [error] The error message if the result is of type `error`
 * @property {string} [message] Extra information about the result
 */

/**
 * Ebi results
 *
 * @typedef {Object} EbiResults
 * @property {EbiResult[]} allResults All search results
 * @property {EbiResult[]} searchMatches All search results that match
 * @property {EbiResult[]} searchNoMatches All search results that do not match
 * @property {EbiResult[]} searchErrors All search errors
 */

/**
 * Ebi results function
 *
 * @typedef {() => EbiResults} EbiResultsFunction
 */

/**
 * Get a function that returns ebi results in a synchronous format
 *
 * @param {Promise<EbiResult>[]} resultsAsync An array of asynchronous ebi results
 * @returns {EbiResultsFunction}
 */
const getSyncResults = resultsAsync => async () => {
	const allResults = await Promise.all(
		resultsAsync.map(promise => {
			return promise.catch(e => e);
		})
	);

	const searchMatches = allResults.filter(({ type }) => type === 'match');
	const searchNoMatches = allResults.filter(
		({ type }) => type === 'no-match'
	);
	const searchErrors = allResults.filter(({ type }) => type === 'error');

	return {
		allResults,
		searchMatches,
		searchNoMatches,
		searchErrors
	};
};

/**
 * Ebi results input
 *
 * @typedef {Object} EbiResultsInput
 * @property {Array} errors
 * @property {string} [search]
 * @property {string} [regex]
 * @property {string} filepath
 * @property {Promise<EbiResult>[]} searchResults
 */

/**
 * Ebi results object
 *
 * @typedef {Object} EbiResultsObject
 * @property {Promise<EbiResult>[]} resultsAsync An array of asynchronous ebi results
 * @property {EbiResultsFunction} getResults Function to get synchronous ebi results
 */

/**
 * Get ebi results in an asynchronous and synchronous format
 *
 * @param {EbiResultsInput} config
 * @returns {EbiResultsObject}
 */
exports.getEbiResults = ({
	errors,
	search,
	regex,
	filepath,
	searchResults
}) => {
	const invalidRepos = errors.map(error => {
		const { repository, line } = error;
		const result = createResult({
			search,
			regex,
			filepath,
			repository
		});
		const message = `ERROR: invalid repository '${repository}' on line ${line}`;
		const output = result(withErrorMessage(message));
		return Promise.reject(output);
	});

	const resultsAsync = invalidRepos.concat(searchResults);
	return {
		resultsAsync,
		getResults: getSyncResults(resultsAsync)
	};
};
