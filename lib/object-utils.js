const { pick, pickBy, merge } = require('lodash');

const findMatchedKeyPairs = (object, filterFn) => {
	if (!object) {
		return;
	}
	const matchedKeys = Object.keys(object).filter(filterFn);
	return pick(object, matchedKeys);
};

const findMatchedValuePairs = (object, filterFn) => {
	if (!object) {
		return;
	}
	return pickBy(object, value => {
		return filterFn(value);
	});
};

const findMatchedKeyValuePairs = (object, filterFn) => {
	if (!object) {
		return;
	}
	return merge(
		findMatchedKeyPairs(object, filterFn),
		findMatchedValuePairs(object, filterFn)
	);
};

module.exports = {
	findMatchedKeyPairs,
	findMatchedValuePairs,
	findMatchedKeyValuePairs
};
