const readline = require('readline');

function readStardardInputLines() {
	const stdinRepos = readline.createInterface({
		input: process.stdin
	});

	return new Promise(resolve => {
		const lines = [];
		stdinRepos
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
