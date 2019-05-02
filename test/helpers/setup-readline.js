const readline = require('readline');

jest.mock('readline');

/**
 * Mock implementation of readline
 */
const setupReadline = () => {
	let lineFn = () => {};
	let closeFn = () => {};
	const readlineInterface = {
		// Keep a reference of the line and close function, so it can
		// be run later
		on: (event, fn) => {
			if (event === 'line') {
				lineFn = fn;
			} else if (event === 'close') {
				closeFn = fn;
			}
			return readlineInterface;
		}
	};

	readline.createInterface.mockImplementation(() => readlineInterface);
	const initialIsTTY = process.stdin.isTTY;
	// Allow standard input to be detected
	process.stdin.isTTY = false;

	return {
		// Send each data line to the line function, then close
		readString: (data = '') => {
			const lines = data.split('\n');
			lines.forEach(lineFn);
			closeFn();
		},
		teardown: () => {
			process.stdin.isTTY = initialIsTTY;
		}
	};
};

module.exports = setupReadline;
