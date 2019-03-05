/*eslint no-console: ["error", { allow: ["log", "error"] }] */
const nock = require('nock');

const createStandardInput = require('../helpers/create-standard-input');
const { base64Encode } = require('../helpers/base64');
const { handler: contentsHandler } = require('../../src/commands/contents');
const repo = 'Financial-Times/next-front-page';

let nockScope;
let standardInput;

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
	standardInput.teardown();
});

describe('Log error for invalid repository', () => {
	const invalidRepository = 'something-invalid';

	test(`'${invalidRepository}'`, async () => {
		createStandardInput(invalidRepository);
		await contentsHandler({
			filepath: 'Procfile',
			search: 'node'
		});

		expect(console.error).toBeCalledWith(
			expect.stringContaining('invalid repository')
		);
	});

	test(`'${invalidRepository}' in json`, async () => {
		createStandardInput(invalidRepository);
		await contentsHandler({
			filepath: 'Procfile',
			search: 'node',
			json: true
		});

		const log = JSON.parse(console.log.mock.calls[0][0]);
		expect(log).toEqual({
			type: 'error',
			filepath: 'Procfile',
			search: 'node',
			repository: invalidRepository,
			error: expect.stringContaining('invalid repository')
		});
	});
});

describe('contents command handler', () => {
	test('ignore empty string repositories', async () => {
		createStandardInput('');

		await contentsHandler({ filepath: 'Procfile', search: 'web' });
		expect(console.log).not.toBeCalled();
		expect(console.error).not.toBeCalled();
	});

	test('no arguments does nothing', async () => {
		createStandardInput('');
		await contentsHandler();
		expect(console.log).not.toBeCalled();
		expect(console.error).not.toBeCalled();
	});

	test('when contents handler is called with valid <file> and <search> values, a list of repositories are logged', async () => {
		nockScope.get(`/${repo}/contents/Procfile`).reply(200, {
			type: 'file',
			content: base64Encode('web: n-cluster server/init.js'),
			path: 'Procfile'
		});
		await contentsHandler({ filepath: 'Procfile', search: 'web' });
		expect(console.log).toBeCalledWith('Financial-Times/next-front-page');
	});

	test('when contents handler is called with valid <file> and <search> and <repo list> values, a list of repositories are logged', async () => {
		createStandardInput('');
		nockScope.get(`/${repo}/contents/Procfile`).reply(200, {
			type: 'file',
			content: base64Encode('web: n-cluster server/init.js'),
			path: 'Procfile'
		});
		await contentsHandler({
			filepath: 'Procfile',
			search: 'web',
			repoList: ['Financial-Times/next-front-page']
		});
		expect(console.log).toBeCalledWith('Financial-Times/next-front-page');
	});

	test('when `contents` command is used with an invalid <file> filepath, the relevant error is logged', async () => {
		nockScope
			.get(`/${repo}/contents/server`)
			.reply(200, [{ path: 'app.js' }, { path: 'libs' }]);
		await contentsHandler({ filepath: 'server', search: 'app' });
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
		await contentsHandler({ filepath: 'Procfile' });
		expect(console.log).toBeCalledWith('Financial-Times/next-front-page');
	});

	test('logs error if file does not exist', async () => {
		nockScope.get(`/${repo}/contents/Procfile`).reply(404);
		await contentsHandler({ filepath: 'Procfile', search: 'something' });

		expect(console.error).toBeCalledWith(expect.stringContaining('ERROR'));
		expect(console.error).toBeCalledWith(
			expect.stringContaining('Financial-Times/next-front-page')
		);
	});

	test('logs error if file does not exist (with no search)', async () => {
		nockScope.get(`/${repo}/contents/Procfile`).reply(404);
		await contentsHandler({ filepath: 'Procfile' });

		expect(console.error).toBeCalledWith(expect.stringContaining('ERROR'));
		expect(console.error).toBeCalledWith(
			expect.stringContaining('Financial-Times/next-front-page')
		);
	});

	test('<search> value not found, does not log', async () => {
		nockScope.get(`/${repo}/contents/Procfile`).reply(200, {
			type: 'file',
			content: base64Encode('web: n-cluster server/init.js'),
			path: 'Procfile'
		});
		await contentsHandler({
			filepath: 'Procfile',
			search: 'something-else'
		});

		expect(console.error).toBeCalledWith(expect.stringContaining(repo));
		expect(console.error).toBeCalledWith(
			expect.stringContaining('no match')
		);
	});

	test('regex is used for search', async () => {
		nockScope.get(`/${repo}/contents/Procfile`).reply(200, {
			type: 'file',
			content: base64Encode('web: node 1234.js'),
			path: 'Procfile'
		});
		await contentsHandler({
			filepath: 'Procfile',
			// NOTE: the extra \'s are not needed on the command line
			regex: '\\d{3}\\.js$'
		});

		expect(console.log).toBeCalledWith(expect.stringContaining(repo));
	});

	test('regex is not matched, logs error', async () => {
		nockScope.get(`/${repo}/contents/Procfile`).reply(200, {
			type: 'file',
			content: base64Encode('web: node 1234.js'),
			path: 'Procfile'
		});
		await contentsHandler({
			filepath: 'Procfile',
			regex: 'something.js$'
		});

		expect(console.log).not.toBeCalled();
		expect(console.error).toBeCalledWith(
			expect.stringContaining('no match')
		);
		expect(console.error).toBeCalledWith(expect.stringContaining(repo));
	});

	test('regex is used if search term also exists', async () => {
		nockScope.get(`/${repo}/contents/Procfile`).reply(200, {
			type: 'file',
			content: base64Encode('web: node 1234.js'),
			path: 'Procfile'
		});
		await contentsHandler({
			filepath: 'Procfile',
			regex: 'something-else',
			search: 'node'
		});

		expect(console.error).toBeCalledWith(
			expect.stringContaining('no match')
		);
	});
});

describe('json output', () => {
	test('shows json', async () => {
		nockScope.get(`/${repo}/contents/Procfile`).reply(200, {
			type: 'file',
			content: base64Encode('web: node 1234.js'),
			path: 'Procfile'
		});
		await contentsHandler({
			json: true,
			filepath: 'Procfile'
		});

		const log = JSON.parse(console.log.mock.calls[0][0]);
		expect(log).toEqual({
			type: 'match',
			filepath: 'Procfile',
			repository: repo,
			fileContents: 'web: node 1234.js'
		});
	});

	test('shows json with search', async () => {
		nockScope.get(`/${repo}/contents/Procfile`).reply(200, {
			type: 'file',
			content: base64Encode('web: node 1234.js'),
			path: 'Procfile'
		});
		await contentsHandler({
			json: true,
			filepath: 'Procfile',
			search: 'node'
		});

		const log = JSON.parse(console.log.mock.calls[0][0]);
		expect(log).toEqual({
			type: 'match',
			filepath: 'Procfile',
			search: 'node',
			repository: repo,
			fileContents: 'web: node 1234.js'
		});
	});

	test('shows json with regex', async () => {
		nockScope.get(`/${repo}/contents/Procfile`).reply(200, {
			type: 'file',
			content: base64Encode('web: node 1234.js'),
			path: 'Procfile'
		});
		await contentsHandler({
			json: true,
			filepath: 'Procfile',
			regex: 'node'
		});

		const log = JSON.parse(console.log.mock.calls[0][0]);
		expect(log).toEqual({
			type: 'match',
			filepath: 'Procfile',
			regex: 'node',
			repository: repo,
			fileContents: 'web: node 1234.js'
		});
	});

	test('shows json error', async () => {
		nockScope.get(`/${repo}/contents/Procfile`).reply(404);
		await contentsHandler({ filepath: 'Procfile', json: true });

		const log = JSON.parse(console.log.mock.calls[0][0]);
		expect(log).toEqual({
			type: 'error',
			filepath: 'Procfile',
			repository: repo,
			error: expect.stringContaining('not found')
		});
	});
});

describe.each([
	[
		[
			'Financial-Times/next-front-page',
			'Financial-Times/next-signup',
			'Financial-Times/n-gage'
		],
		2
	],
	[['Financial-Times/next-front-page', 'Financial-Times/next-signup'], 2],
	[['Financial-Times/next-front-page'], 1]
])('test limit flag of value 2', (repositories, numResults) => {
	test(`${
		repositories.length
	} repos returns ${numResults} results`, async () => {
		const repositoriesForStdIn = repositories.join('\n');
		createStandardInput(repositoriesForStdIn);
		repositories.forEach(repo => {
			nockScope.get(`/${repo}/contents/Procfile`).reply(200, {
				type: 'file',
				content: base64Encode('web: n-cluster server/init.js'),
				path: 'Procfile'
			});
		});
		await contentsHandler({
			filepath: 'Procfile',
			search: 'web',
			limit: 2
		});
		expect(console.log).toHaveBeenCalledTimes(numResults);
	});
});
