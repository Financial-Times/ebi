const { createResult, withErrorMessage } = require('../../lib/create-result');

/**
 * Return a function that returns ebi results in a synchronous format
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
 * Get ebi results in an asynchronous and synchronous format
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
