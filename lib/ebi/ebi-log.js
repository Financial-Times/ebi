const { logText, logJson } = require('../log-result');
const { withErrorMessage } = require('../create-result');

const logOutput = ({ json, output }) => {
	if (json) {
		logJson(output);
	} else {
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
exports.ebiLog = ({ ebiSearch, json }) => repoList => {
	return ebiSearch(repoList)
		.then(({ resultsAsync }) => {
			const results = resultsAsync.map(result => {
				return result
					.then(output => logOutput({ json, output }))
					.catch(error => logOutput({ json, output: error }));
			});
			return Promise.all(results);
		})
		.catch(({ message }) =>
			logOutput({
				json,
				output: withErrorMessage(`ERROR: ${message}`)
			})
		);
};
