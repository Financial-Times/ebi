const { logText, logJson } = require('../log-result');
const { RESULT_TYPES } = require('./result-types');
const { withErrorMessage } = require('../create-result');

const logOutput = ({ verbose, json, output }) => {
	const { type } = output;

	if (json) {
		logJson(output);
	} else {
		// Ignore non-matches if not in verbose mode
		if (type !== RESULT_TYPES.match && !verbose) {
			return;
		}
		logText(output);
	}
};

/*
 * Log ebi searches
 *
 * @param {function} ebiSearch - ebi search function in the form `searchFn({ someConfig })`
 * @param {boolean} json - whether to log in json or plain text
 * @param {array} arrayList - repository list
 */
exports.ebiLog = ({ ebiSearch, json, verbose }) => repoList => {
	return ebiSearch(repoList)
		.then(({ resultsAsync }) => {
			const results = resultsAsync.map(result => {
				return result
					.then(output => logOutput({ verbose, json, output }))
					.catch(error =>
						logOutput({ verbose, json, output: error })
					);
			});
			return Promise.all(results);
		})
		.catch(({ message }) =>
			logOutput({
				verbose,
				json,
				output: withErrorMessage(`ERROR: ${message}`)
			})
		);
};
