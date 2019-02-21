const nock = require('nock');

const createStandardInput = require('../helpers/create-standard-input');
const { base64Encode } = require('../helpers/base64');
const contentsCommand = require('../../src/commands/contents');
const repo = 'Financial-Times/next-front-page';

describe('contents command handler', () => {
	const contentsHandler = contentsCommand.handler;

	beforeEach(() => {
		standardInput = createStandardInput(repo);
		nockScope = nock('https://api.github.com/repos');
		jest.spyOn(console, 'error')
			.mockImplementation()
			.mockName('console.error');
		jest.spyOn(console, 'log')
			.mockImplementation()
			.mockName('console.log');
	});

	afterEach(() => {
		nock.cleanAll();
		jest.resetAllMocks();
	});

	test('when contents handler is called with valid <file> and <search> values, a list of repositories are logged', async () => {
		nockScope.get(`/${repo}/contents/Procfile`).reply(200, {
			type: 'file',
			content: base64Encode('web: n-cluster server/init.js'),
			path: 'Procfile'
		});
		await contentsHandler({ file: 'Procfile', search: 'web' });
		expect(console.log).toBeCalledWith('Financial-Times/next-front-page');
	});

	test('when `contents` command is used with an invalid <file> filepath, the relevant error is logged', async () => {
		nockScope
			.get(`/${repo}/contents/server`)
			.reply(200, [{ path: 'app.js' }, { path: 'libs' }]);
		await contentsHandler({ file: 'server', search: 'app' });
		expect(console.error).toBeCalledWith(
			expect.stringContaining(`'server' is not a file path`)
		);
	});

	test('empty `contents` search, logs existence of file', async () => {
		nockScope.get(`/${repo}/contents/Procfile`).reply(200, {
			type: 'file',
			content: base64Encode('web: n-cluster server/init.js'),
			path: 'Procfile'
		});
		await contentsHandler({ file: 'Procfile' });
		expect(console.log).toBeCalledWith('Financial-Times/next-front-page');
	});

	test('logs error if file does not exist', async () => {
		nockScope.get(`/${repo}/contents/Procfile`).reply(404);
		await contentsHandler({ file: 'Procfile', search: 'something' });

		expect(console.error).toBeCalledWith(expect.stringContaining('ERROR'));
		expect(console.error).toBeCalledWith(
			expect.stringContaining('Financial-Times/next-front-page')
		);
	});

	test('logs error if file does not exist (with no search)', async () => {
		nockScope.get(`/${repo}/contents/Procfile`).reply(404);
		await contentsHandler({ file: 'Procfile' });

		expect(console.error).toBeCalledWith(expect.stringContaining('ERROR'));
		expect(console.error).toBeCalledWith(
			expect.stringContaining('Financial-Times/next-front-page')
		);
	});

	test('<search> value not found, logs info message in console error', async () => {
		nockScope.get(`/${repo}/contents/Procfile`).reply(200, {
			type: 'file',
			content: base64Encode('web: n-cluster server/init.js'),
			path: 'Procfile'
		});
		await contentsHandler({
			file: 'Procfile',
			search: 'something-else'
		});

		expect(console.error).toBeCalledWith(expect.stringContaining(repo));
		expect(console.error).toBeCalledWith(
			expect.stringContaining('no match')
		);
	});
});
