const readline = require('readline');

jest.mock('readline');

/**
 * Mock implementation of readline
 *
 * @param {function} createInterface - Mock implementation of `readline.createInterface`. Uses a default implementation if not specified
 */
const setupReadline = ({ createInterface } = {}) => {
	let lineFn = () => {};
	let closeFn = () => {};

	const mockReadlineInterface = !!createInterface
		? createInterface()
		: {
				// Keep a reference of the line and close function, so it can
				// be run later
				on: (event, fn) => {
					if (event === 'line') {
						lineFn = fn;
					} else if (event === 'close') {
						closeFn = fn;
					}
					return mockReadlineInterface;
				}
		  };

	readline.createInterface.mockImplementation(() => mockReadlineInterface);
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
