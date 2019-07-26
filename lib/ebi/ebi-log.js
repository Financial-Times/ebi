const { logText, logJson } = require('../log-result');

/*
 * Log ebi searches
 *
 * @param {function} ebiSearch - ebi search function in the form `searchFn({ someConfig })`
 * @param {boolean} json - whether to log in json or plain text
 * @param {array} arrayList - repository list
 */
exports.ebiLog = ({ ebiSearch, json }) => async repoList => {
	const results = await ebiSearch(repoList);

	const allRepos = results.map(async result => {
		let output;
		try {
			output = await result;
		} catch (error) {
			output = error;
		}

		if (json) {
			logJson(output);
		} else {
			logText(output);
		}
	});

	return Promise.all(allRepos);
};
