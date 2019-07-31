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
exports.ebiLog = ({ ebiSearch, json }) => async repoList => {
	let results;

	try {
		results = await ebiSearch(repoList);
	} catch ({ message }) {
		return logOutput({
			json,
			output: withErrorMessage(`ERROR: ${message}`)
		});
	}

	const allRepos = results.map(async result => {
		let output;
		try {
			output = await result;
		} catch (error) {
			output = error;
		}

		logOutput({ json, output });
	});

	return Promise.all(allRepos);
};
