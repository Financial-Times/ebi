/*eslint no-console: ["error", { allow: ["log", "error"] }] */
const logText = result => {
	const { type, repository, error } = result;
	if (type === 'error') {
		console.error(error);
	} else {
		console.log(repository);
	}
};

const logTextWithSuffix = suffixFn => result => {
	const { type, repository, error } = result;

	if (type === 'error') {
		console.error(error);
	} else {
		const suffixStr = suffixFn ? ` ${suffixFn(result)}` : '';
		console.log(`${repository}${suffixStr}`);
	}
};

const logJson = result => {
	const output = JSON.stringify(result);

	console.log(output);
};

module.exports = {
	logText,
	logTextWithSuffix,
	logJson
};