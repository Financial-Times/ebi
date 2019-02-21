const nock = require('nock');

const createStandardInput = require('../helpers/create-standard-input');
const contentsCommand = require('../../src/commands/contents');
const repo = 'Financial-Times/next-front-page';

describe('contents command handler', () => {
	const contentsHandler = contentsCommand.handler;

	beforeEach(() => {
		standardInput = createStandardInput(repo);
		nockScope = nock('https://api.github.com/repos');
		// NB comment out this spy on console.error if you want to see errors during your tests
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
			content: 'd2ViOiBuLWNsdXN0ZXIgc2VydmVyL2luaXQuanM=', //base64 encoding of 'web: n-cluster server/init.js'
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

	test('when 3 repos are tested and a limit of 2 is specified, only 2 repos are logged', async () => {
		const repositories = [
			'Financial-Times/next-front-page',
			'Financial-Times/next-signup',
			'Financial-Times/n-gage'
		];
		const repositoriesForStdIn = repositories.join('\n');
		standardInput = createStandardInput(repositoriesForStdIn);
		repositories.forEach(repo => {
			nockScope.get(`/${repo}/contents/Procfile`).reply(200, {
				type: 'file',
				content: 'd2ViOiBuLWNsdXN0ZXIgc2VydmVyL2luaXQuanM=', //base64 encoding of 'web: n-cluster server/init.js'
				path: 'Procfile'
			});
		});
		await contentsHandler({
			file: 'Procfile',
			search: 'web',
			limit: 2
		});
		expect(console.log).toHaveBeenCalledTimes(2);
	});

	test('when 2 repos are tested and a limit of 2 is specified, 2 repos are logged', async () => {
		const repositories = [
			'Financial-Times/next-front-page',
			'Financial-Times/next-signup'
		];
		const repositoriesForStdIn = repositories.join('\n');
		standardInput = createStandardInput(repositoriesForStdIn);
		repositories.forEach(repo => {
			nockScope.get(`/${repo}/contents/Procfile`).reply(200, {
				type: 'file',
				content: 'd2ViOiBuLWNsdXN0ZXIgc2VydmVyL2luaXQuanM=', //base64 encoding of 'web: n-cluster server/init.js'
				path: 'Procfile'
			});
		});
		await contentsHandler({
			file: 'Procfile',
			search: 'web',
			limit: 2
		});
		expect(console.log).toHaveBeenCalledTimes(2);
	});

	test('when 1 repos is tested and a limit of 2 is specified, 1 repo is logged', async () => {
		nockScope.get(`/${repo}/contents/Procfile`).reply(200, {
			type: 'file',
			content: 'd2ViOiBuLWNsdXN0ZXIgc2VydmVyL2luaXQuanM=', //base64 encoding of 'web: n-cluster server/init.js'
			path: 'Procfile'
		});
		await contentsHandler({
			file: 'Procfile',
			search: 'web',
			limit: 2
		});
		expect(console.log).toHaveBeenCalledTimes(1);
	});

	test('<search> value not found, does not log', async () => {
		nockScope.get(`/${repo}/contents/Procfile`).reply(200, {
			type: 'file',
			content: 'd2ViOiBuLWNsdXN0ZXIgc2VydmVyL2luaXQuanM=', //base64 encoding of 'web: n-cluster server/init.js'
			path: 'Procfile'
		});
		await contentsHandler({
			file: 'Procfile',
			search: 'something-else'
		});
		expect(console.log).not.toBeCalled();
	});
});
