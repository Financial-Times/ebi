const nock = require('nock');

const { base64Encode } = require('../helpers/base64');
const getContents = require('../../lib/get-contents');
const repo = 'Financial-Times/next-front-page';

let nockScope;

describe('getContents', () => {
	beforeEach(() => {
		nockScope = nock('https://api.github.com/repos');
	});

	afterEach(() => {
		nock.cleanAll();
		jest.resetAllMocks();
	});

	test('when valid arguments are passed (for repository and path) the decoded repo data is returned', async () => {
		const filepath = 'Procfile';
		nockScope.get(`/${repo}/contents/${filepath}`).reply(200, {
			type: 'file',
			content: base64Encode('web: n-cluster server/init.js'),
			path: 'Procfile'
		});
		const getPathContents = getContents({
			filepath,
			githubToken: '123'
		});
		expect(await getPathContents(repo)).toContain('web: n-cluster');
	});

	test('when repository not found correct error is thrown', async () => {
		const invalidRepo = 'Financial-Times/invalid';
		const filepath = 'package.json';
		nockScope.get(`/${invalidRepo}/contents/${filepath}`).reply(404, {
			message: 'Not Found'
		});
		const getPathContents = getContents({
			filepath,
			githubToken: '123'
		});
		try {
			await getPathContents(invalidRepo);
			expect(false).toBe(true);
		} catch (error) {
			expect(error.message).toContain('404 ERROR');
		}
	});

	test('when file path is invalid correct error is thrown', async () => {
		const invalidPath = 'server';
		nockScope
			.get(`/${repo}/contents/${invalidPath}`)
			.reply(200, [{ path: 'app.js' }, { path: 'libs' }]);
		const getPathContents = getContents({
			filepath: invalidPath,
			githubToken: '123'
		});
		try {
			await getPathContents(repo);
			expect(false).toBe(true);
		} catch (error) {
			expect(error.message).toContain(
				'Incorrect value provided for <file>'
			);
		}
	});
});
