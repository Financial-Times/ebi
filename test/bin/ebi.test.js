const { exec } = require('child_process');

describe('ebi command line', () => {
	it('throws error if contents search has search term and regex', done => {
		const command =
			'echo "Financial-Times/ebi" | ./bin/ebi.js contents package.json --regex regex-term search-term';
		exec(command, 'utf8', (err, stdout, stderr) => {
			expect(stderr).toContain('use `search` or `regex`, not both');
			done();
		});
	});

	it('throws error if package search has search term and regex', done => {
		const command =
			'echo "Financial-Times/ebi" | ./bin/ebi.js package --regex regex-term search-term';
		exec(command, 'utf8', (err, stdout, stderr) => {
			expect(stderr).toContain('use `search` or `regex`, not both');
			done();
		});
	});

	it('throws error if package:engines search has search term and regex', done => {
		const command =
			'echo "Financial-Times/ebi" | ./bin/ebi.js package:engines --regex regex-term search-term';
		exec(command, 'utf8', (err, stdout, stderr) => {
			expect(stderr).toContain('use `search` or `regex`, not both');
			done();
		});
	});
});
