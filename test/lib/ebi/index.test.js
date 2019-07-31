const {
	contentsSearch,
	packageSearch,
	packageEnginesSearch
} = require('../../../lib/ebi');

describe('ebi library', () => {
	test('package exists', () => {
		expect(contentsSearch).toBeTruthy();
	});

	test('package exists', () => {
		expect(packageSearch).toBeTruthy();
	});

	test('packageEngines exists', () => {
		expect(packageEnginesSearch).toBeTruthy();
	});
});
