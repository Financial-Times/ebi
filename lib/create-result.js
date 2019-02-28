/**
 * Create result with initial data, then augment with `with*` functions
 * or custom data
 */
const createResult = initData => (data = {}) => {
	return Object.assign({}, { ...initData }, data);
};

const withMatch = data => {
	const matchResult = createResult({ type: 'match' });
	return matchResult(data);
};

const withMatchFileContents = fileContents => {
	return withMatch({
		fileContents
	});
};

const withErrorMessage = message => {
	const errorResult = createResult({ type: 'error' });
	return errorResult({
		error: message
	});
};

module.exports = {
	createResult,
	withMatch,
	withMatchFileContents,
	withErrorMessage
};
