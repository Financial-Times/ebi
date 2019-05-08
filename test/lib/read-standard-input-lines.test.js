const setupReadline = require('../helpers/setup-readline');
const readStardardInputLines = require('../../lib/read-standard-input-lines');

const setupReadStdin = async ({ input, createInterface } = {}) => {
	const { readString, teardown } = setupReadline({ createInterface });
	const read = readStardardInputLines();
	readString(input);
	const lines = await read;
	teardown();

	return lines;
};

describe('readStardardInputLines', () => {
	test('outputs empty array with no input', async () => {
		const lines = await setupReadStdin();
		expect(lines).toEqual([]);
	});

	test('outputs empty array with no readline interface (ie, no standard input)', async () => {
		// Return nothing for createInterface to simulate no standard input
		const lines = await setupReadStdin({ createInterface: () => {} });
		expect(lines).toEqual([]);
	});

	test('outputs empty array with empty string', async () => {
		const lines = await setupReadStdin({ input: '' });
		expect(lines).toEqual([]);
	});

	test('outputs one line', async () => {
		const lines = await setupReadStdin({ input: 'something' });
		expect(lines).toEqual(['something']);
	});

	test('outputs multiple lines', async () => {
		const lines = await setupReadStdin({ input: 'something\nsomething2' });
		expect(lines).toEqual(['something', 'something2']);
	});

	test('outputs ignores empty lines', async () => {
		const lines = await setupReadStdin({
			input: 'something\n\nsomething2'
		});
		expect(lines).toEqual(['something', 'something2']);
	});
});
