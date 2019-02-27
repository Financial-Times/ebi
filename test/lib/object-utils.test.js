const {
	findMatchedKeyPairs,
	findMatchedValuePairs,
	findMatchedKeyValuePairs
} = require('../../lib/object-utils');

const alwaysTrue = () => true;
const alwaysFalse = () => false;

describe.each([
	['undefined', undefined, alwaysTrue, undefined],
	['empty object', {}, alwaysTrue, {}],
	[
		'match key',
		{ hello: 1, noHello: 2 },
		key => key === 'hello',
		{ hello: 1 }
	],
	[
		'no key matched',
		{ hello: 1, noHello: 2 },
		key => key === 'something-else',
		{}
	]
])('findMatchedKeyPairs', (description, object, filterFn, expected) => {
	test(`${description}`, async () => {
		expect(findMatchedKeyPairs(object, filterFn)).toEqual(expected);
	});
});

test('findMatchedKeyPairs returns a new object', () => {
	const object = { hello: 1 };
	const result = findMatchedKeyPairs(object, alwaysTrue);
	expect(result).not.toBe(object);
});

test('findMatchedKeyPairs does not modify input', () => {
	const object = { hello: 1 };
	findMatchedKeyPairs(object, alwaysFalse);
	expect(object).toEqual({ hello: 1 });
});

describe.each([
	['undefined', undefined, alwaysTrue, undefined],
	['empty object', {}, alwaysTrue, {}],
	[
		'match value',
		{ hello: 1, noHello: 2 },
		value => value === 1,
		{ hello: 1 }
	],
	[
		'no value matched',
		{ hello: 1, noHello: 2 },
		value => value === 'something-else',
		{}
	]
])('findMatchedValuePairs', (description, object, filterFn, expected) => {
	test(`${description}`, async () => {
		expect(findMatchedValuePairs(object, filterFn)).toEqual(expected);
	});
});

test('findMatchedValuePairs returns a new object', () => {
	const object = { hello: 1 };
	const result = findMatchedValuePairs(object, alwaysTrue);
	expect(result).not.toBe(object);
});

test('findMatchedValuePairs does not modify input', () => {
	const object = { hello: 1 };
	findMatchedValuePairs(object, alwaysFalse);
	expect(object).toEqual({ hello: 1 });
});

describe.each([
	['undefined', undefined, alwaysTrue, undefined],
	['empty object', {}, alwaysTrue, {}],
	[
		'match key',
		{ hello: 1, noHello: 2 },
		value => value === 'hello',
		{ hello: 1 }
	],
	[
		'match value',
		{ hello: 1, noHello: 2 },
		value => value === 1,
		{ hello: 1 }
	],
	[
		'no value matched',
		{ hello: 1, noHello: 2 },
		value => value === 'something-else',
		{}
	]
])('findMatchedKeyValuePairs', (description, object, filterFn, expected) => {
	test(`${description}`, async () => {
		expect(findMatchedKeyValuePairs(object, filterFn)).toEqual(expected);
	});
});

test('findMatchedValuePairs returns a new object', () => {
	const object = { hello: 1 };
	const result = findMatchedKeyValuePairs(object, alwaysTrue);
	expect(result).not.toBe(object);
});

test('findMatchedValuePairs does not modify input', () => {
	const object = { hello: 1 };
	findMatchedKeyValuePairs(object, alwaysFalse);
	expect(object).toEqual({ hello: 1 });
});
