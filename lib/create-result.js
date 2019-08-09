const { RESULT_TYPES } = require('./ebi/result-types');

/**
 * Create result with initial data, then augment with `with*` functions
 * or custom data
 */
const createResult = initData => (data = {}) => {
	return Object.assign({}, { ...initData }, data);
};

const withMatch = createResult({ type: RESULT_TYPES.match });
const withMatchFileContents = fileContents => {
	return withMatch({
		fileContents
	});
};

const withNoMatch = createResult({ type: RESULT_TYPES.noMatch });
const withNoMatchMessage = message => {
	return withNoMatch({
		message
	});
};
const withNoMatchMessageFileContents = ({ message, fileContents }) => {
	return withNoMatch({
		fileContents,
		message
	});
};

const withErrorMessage = message => {
	const errorResult = createResult({ type: RESULT_TYPES.error });
	return errorResult({
		error: message
	});
};

module.exports = {
	createResult,
	withMatch,
	withMatchFileContents,
	withNoMatch,
	withNoMatchMessage,
	withNoMatchMessageFileContents,
	withErrorMessage
};
