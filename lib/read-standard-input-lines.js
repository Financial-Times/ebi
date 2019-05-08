const readline = require('readline');

function readStardardInputLines() {
	const readlineInterface = readline.createInterface({
		input: process.stdin
	});

	return new Promise(resolve => {
		const lines = [];

		// readlineInterface is undefined when there is no standard input
		if (!readlineInterface) {
			return resolve(lines);
		}

		readlineInterface
			.on('line', line => {
				if (!line) {
					return;
				}
				lines.push(line.trim());
			})
			.on('close', () => {
				resolve(lines);
			});
	});
}

module.exports = readStardardInputLines;
