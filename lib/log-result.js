/*eslint no-console: ["error", { allow: ["log", "error"] }] */
const logText = result => {
	const { type, repository, error, textSuffix } = result;
	if (type === 'error') {
		console.error(error);
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
