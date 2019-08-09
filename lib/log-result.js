/*eslint no-console: ["error", { allow: ["log", "error"] }] */

const { RESULT_TYPES } = require('./ebi/result-types');

const logText = result => {
	const { type, repository, error, message, textSuffix } = result;
	if (type === RESULT_TYPES.error) {
		console.error(error);
	} else if (type === RESULT_TYPES.noMatch) {
		console.error(message);
	} else {
		console.log(`${repository}${!!textSuffix ? ` ${textSuffix}` : ''}`);
	}
};

const logJson = result => {
	const output = JSON.stringify(result);

	console.log(output);
};

module.exports = {
	logText,
	logJson
};
