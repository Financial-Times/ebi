/*eslint no-console: ["error", { allow: ["log", "error"] }] */
const nock = require('nock');

const setupReadline = require('../helpers/setup-readline');
const { base64Encode } = require('../helpers/base64');
const { handler: contentsHandler } = require('../../src/commands/contents');
const repo = 'Financial-Times/next-front-page';

let nockScope;

const INPUT_TYPES = {
	ARGS: 'args',
	STDIN: 'stdin'
};

beforeEach(() => {
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

const initializeHandlerForStdin = ({ repos, args }) => {
	const reposString = repos.join('\n');
	const { readString, teardown } = setupReadline(reposString);
	const handler = contentsHandler(args);
	readString(reposString);

	return handler.then(teardown);
};

const initializeContentsHandler = ({ repos = [], args, inputType }) => {
	if (inputType === INPUT_TYPES.ARGS) {
		return contentsHandler({
			...args,
			repoList: repos
		});
	} else if (inputType === INPUT_TYPES.STDIN) {
		return initializeHandlerForStdin({ repos, args });
	} else {
		throw new Error('Invalid contents handler inputType');
	}
};

describe('Log error for invalid repository', () => {
	const invalidRepository = 'something-invalid';

	test(`'${invalidRepository}'`, async () => {
		await initializeContentsHandler({
			repos: [invalidRepository],
			inputType: INPUT_TYPES.STDIN,
			args: {
				filepath: 'Procfile',
				search: 'node'
			}
		});

		expect(console.error).toBeCalledWith(
			expect.stringContaining('invalid repository')
		);
	});

	test(`'${invalidRepository}' in json`, async () => {
		await initializeContentsHandler({
			repos: [invalidRepository],
			inputType: INPUT_TYPES.STDIN,
			args: {
				filepath: 'Procfile',
				search: 'node',
				json: true
			}
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
		await initializeContentsHandler({
			repos: [],
			inputType: INPUT_TYPES.STDIN,
			args: {
				filepath: 'Procfile',
				search: 'web'
			}
		});

		expect(console.log).not.toBeCalled();
		expect(console.error).not.toBeCalled();
	});

	test('no arguments does nothing', async () => {
		await initializeContentsHandler({
			inputType: INPUT_TYPES.STDIN
		});

		expect(console.log).not.toBeCalled();
		expect(console.error).not.toBeCalled();
	});

	test('when contents handler is called with valid <file> and <search> values, a list of repositories are logged', async () => {
		nockScope.get(`/${repo}/contents/Procfile`).reply(200, {
			type: 'file',
			content: base64Encode('web: n-cluster server/init.js'),
			path: 'Procfile'
		});

		await initializeContentsHandler({
			repos: [repo],
			inputType: INPUT_TYPES.STDIN,
			args: { filepath: 'Procfile', search: 'web' }
		});

		expect(console.log).toBeCalledWith('Financial-Times/next-front-page');
	});

	test('when contents handler is called with valid <file> and <search> and <repo list> values, a list of repositories are logged', async () => {
		nockScope.get(`/${repo}/contents/Procfile`).reply(200, {
			type: 'file',
			content: base64Encode('web: n-cluster server/init.js'),
			path: 'Procfile'
		});

		await initializeContentsHandler({
			repos: [repo],
			args: { filepath: 'Procfile', search: 'web' },
			inputType: INPUT_TYPES.STDIN
		});
		expect(console.log).toBeCalledWith('Financial-Times/next-front-page');
	});

	test('when `contents` command is used with an invalid <file> filepath, the relevant error is logged', async () => {
		nockScope
			.get(`/${repo}/contents/server`)
			.reply(200, [{ path: 'app.js' }, { path: 'libs' }]);

		await initializeContentsHandler({
			repos: [repo],
			args: { filepath: 'server', search: 'app' },
			inputType: INPUT_TYPES.STDIN
		});

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

		await initializeContentsHandler({
			repos: [repo],
			args: { filepath: 'Procfile' },
			inputType: INPUT_TYPES.STDIN
		});
		expect(console.log).toBeCalledWith('Financial-Times/next-front-page');
	});

	test('logs error if file does not exist', async () => {
		nockScope.get(`/${repo}/contents/Procfile`).reply(404);

		await initializeContentsHandler({
			repos: [repo],
			args: { filepath: 'Procfile', search: 'something' },
			inputType: INPUT_TYPES.STDIN
		});

		expect(console.error).toBeCalledWith(expect.stringContaining('ERROR'));
		expect(console.error).toBeCalledWith(
			expect.stringContaining('Financial-Times/next-front-page')
		);
	});

	test('logs error if file does not exist (with no search)', async () => {
		nockScope.get(`/${repo}/contents/Procfile`).reply(404);

		await initializeHandlerForStdin({
			repos: [repo],
			args: { filepath: 'Procfile' }
		});

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

		await initializeContentsHandler({
			repos: [repo],
			args: { filepath: 'Procfile', search: 'something-else' },
			inputType: INPUT_TYPES.STDIN
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

		await initializeContentsHandler({
			repos: [repo],
			args: { filepath: 'Procfile', regex: '\\d{3}\\.js$' },
			inputType: INPUT_TYPES.STDIN
		});

		expect(console.log).toBeCalledWith(expect.stringContaining(repo));
	});

	test('regex is not matched, logs error', async () => {
		nockScope.get(`/${repo}/contents/Procfile`).reply(200, {
			type: 'file',
			content: base64Encode('web: node 1234.js'),
			path: 'Procfile'
		});

		await initializeContentsHandler({
			repos: [repo],
			args: { filepath: 'Procfile', regex: 'something.js$' },
			inputType: INPUT_TYPES.STDIN
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

		await initializeContentsHandler({
			repos: [repo],
			args: {
				filepath: 'Procfile',
				regex: 'something-else',
				search: 'node'
			},
			inputType: INPUT_TYPES.STDIN
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

		await initializeContentsHandler({
			repos: [repo],
			args: { json: true, filepath: 'Procfile' },
			inputType: INPUT_TYPES.STDIN
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

		await initializeContentsHandler({
			repos: [repo],
			args: { json: true, filepath: 'Procfile', search: 'node' },
			inputType: INPUT_TYPES.STDIN
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

		await initializeContentsHandler({
			repos: [repo],
			args: { json: true, filepath: 'Procfile', regex: 'node' },
			inputType: INPUT_TYPES.STDIN
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

	test('shows json with no match', async () => {
		nockScope.get(`/${repo}/contents/Procfile`).reply(200, {
			type: 'file',
			content: base64Encode('web: node 1234.js'),
			path: 'Procfile'
		});

		await initializeContentsHandler({
			repos: [repo],
			args: {
				json: true,
				filepath: 'Procfile',
				search: 'something-else'
			},
			inputType: INPUT_TYPES.STDIN
		});

		const log = JSON.parse(console.log.mock.calls[0][0]);
		expect(log).toEqual({
			type: 'no-match',
			filepath: 'Procfile',
			search: 'something-else',
			repository: repo,
			message: expect.stringContaining('no match'),
			fileContents: 'web: node 1234.js'
		});
	});

	test('shows json error', async () => {
		nockScope.get(`/${repo}/contents/Procfile`).reply(404);

		await initializeContentsHandler({
			repos: [repo],
			args: { json: true, filepath: 'Procfile' },
			inputType: INPUT_TYPES.STDIN
		});

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
])('test limit flag of value 2', (repos, numResults) => {
	test(`${repos.length} repos returns ${numResults} results`, async () => {
		repos.forEach(repo => {
			nockScope.get(`/${repo}/contents/Procfile`).reply(200, {
				type: 'file',
				content: base64Encode('web: n-cluster server/init.js'),
				path: 'Procfile'
			});
		});

		await initializeContentsHandler({
			repos,
			args: { filepath: 'Procfile', search: 'web', limit: 2 },
			inputType: INPUT_TYPES.STDIN
		});

		expect(console.log).toHaveBeenCalledTimes(numResults);
	});
});
