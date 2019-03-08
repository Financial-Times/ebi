/*eslint no-console: ["error", { allow: ["log", "error"] }] */
const nock = require('nock');

const createStandardInput = require('../helpers/create-standard-input');
const { base64EncodeObj } = require('../helpers/base64');
const { handler: packageHandler } = require('../../src/commands/package');
const repo = 'Financial-Times/next-front-page';

let standardInput;
let nockScope;

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
		await packageHandler({ search: 'something' });

		expect(console.error).toBeCalledWith(
			expect.stringContaining('invalid repository')
		);
	});

	test(`'${invalidRepository}' in json`, async () => {
		createStandardInput(invalidRepository);
		await packageHandler({ search: 'something', json: true });

		const log = JSON.parse(console.log.mock.calls[0][0]);
		expect(log).toEqual({
			type: 'error',
			filepath: 'package.json',
			search: 'something',
			repository: invalidRepository,
			error: expect.stringContaining('invalid repository')
		});
	});
});

describe('package command handler', () => {
	test('ignore empty string repositories', async () => {
		createStandardInput('');

		await packageHandler({ search: 'something' });
		expect(console.log).not.toBeCalled();
		expect(console.error).not.toBeCalled();
	});

	test('no arguments does nothing', async () => {
		createStandardInput('');
		await packageHandler();
		expect(console.log).not.toBeCalled();
		expect(console.error).not.toBeCalled();
	});

	test('repoList argument returns search results', async () => {
		nockScope.get(`/${repo}/contents/package.json`).reply(200, {
			type: 'file',
			content: base64EncodeObj({
				name: 'next-front-page'
			}),
			path: 'package.json'
		});
		await packageHandler({
			search: 'name',
			repoList: repo
		});
		expect(console.log).toBeCalledWith('Financial-Times/next-front-page');
	});

	test('repository not found', async () => {
		const invalidRepo = 'Financial-Times/invalid';
		standardInput = createStandardInput(invalidRepo);
		nockScope.get(`/${invalidRepo}/contents/package.json`).reply(404, {
			message: 'Not Found'
		});
		await packageHandler({ search: 'something' });
		expect(console.error).toBeCalledWith(
			expect.stringContaining('404 ERROR')
		);
	});

	test('found <search> value logs repository', async () => {
		nockScope.get(`/${repo}/contents/package.json`).reply(200, {
			type: 'file',
			content: base64EncodeObj({
				name: 'next-front-page'
			}),
			path: 'package.json'
		});
		await packageHandler({ search: 'name' });
		expect(console.log).toBeCalledWith('Financial-Times/next-front-page');
	});

	test('empty <search> value, logs existence of file', async () => {
		nockScope.get(`/${repo}/contents/package.json`).reply(200, {
			type: 'file',
			content: base64EncodeObj({
				name: 'next-front-page'
			}),
			path: 'package.json'
		});
		await packageHandler({});
		expect(console.log).toBeCalledWith('Financial-Times/next-front-page');
	});

	test('<search> value not found, logs info message in console error', async () => {
		nockScope.get(`/${repo}/contents/package.json`).reply(200, {
			type: 'file',
			content: base64EncodeObj({
				name: 'next-front-page'
			}),
			path: 'package.json'
		});
		await packageHandler({ search: 'something-else' });
		expect(console.error).toBeCalledWith(expect.stringContaining(repo));
		expect(console.error).toBeCalledWith(
			expect.stringContaining('no match')
		);
	});

	test('regex is used for search', async () => {
		nockScope.get(`/${repo}/contents/package.json`).reply(200, {
			type: 'file',
			content: base64EncodeObj({
				name: 'next-front-page'
			}),
			path: 'package.json'
		});
		await packageHandler({
			// NOTE: the extra \'s are not needed on the command line
			regex: 'front-.*$'
		});

		expect(console.log).toBeCalledWith(expect.stringContaining(repo));
	});

	test('regex is not matched, logs error', async () => {
		nockScope.get(`/${repo}/contents/package.json`).reply(200, {
			type: 'file',
			content: base64EncodeObj({
				name: 'next-front-page'
			}),
			path: 'package.json'
		});
		await packageHandler({
			regex: 'something$'
		});

		expect(console.log).not.toBeCalled();
		expect(console.error).toBeCalledWith(
			expect.stringContaining('no match')
		);
		expect(console.error).toBeCalledWith(expect.stringContaining(repo));
	});

	test('regex is used if search term also exists', async () => {
		nockScope.get(`/${repo}/contents/package.json`).reply(200, {
			type: 'file',
			content: base64EncodeObj({
				name: 'next-front-page'
			}),
			path: 'package.json'
		});
		await packageHandler({
			regex: 'something-else',
			search: 'front'
		});

		expect(console.error).toBeCalledWith(
			expect.stringContaining('no match')
		);
	});
});

describe('json output', () => {
	let packageJson;
	beforeEach(() => {
		packageJson = {
			name: 'next-front-page'
		};
	});

	test('shows json', async () => {
		nockScope.get(`/${repo}/contents/package.json`).reply(200, {
			type: 'file',
			content: base64EncodeObj(packageJson),
			path: 'package.json'
		});
		await packageHandler({ json: true });

		const log = JSON.parse(console.log.mock.calls[0][0]);
		expect(log).toEqual({
			type: 'match',
			filepath: 'package.json',
			repository: repo,
			fileContents: JSON.stringify(packageJson)
		});
	});

	test('shows json with search', async () => {
		nockScope.get(`/${repo}/contents/package.json`).reply(200, {
			type: 'file',
			content: base64EncodeObj(packageJson),
			path: 'package.json'
		});
		await packageHandler({ search: 'name', json: true });

		const log = JSON.parse(console.log.mock.calls[0][0]);
		expect(log).toEqual({
			type: 'match',
			filepath: 'package.json',
			search: 'name',
			repository: repo,
			fileContents: JSON.stringify(packageJson)
		});
	});

	test('shows json with regex', async () => {
		nockScope.get(`/${repo}/contents/package.json`).reply(200, {
			type: 'file',
			content: base64EncodeObj(packageJson),
			path: 'package.json'
		});
		await packageHandler({ regex: 'front-.*', json: true });

		const log = JSON.parse(console.log.mock.calls[0][0]);
		expect(log).toEqual({
			type: 'match',
			filepath: 'package.json',
			regex: 'front-.*',
			repository: repo,
			fileContents: JSON.stringify(packageJson)
		});
	});

	test('shows json error', async () => {
		nockScope.get(`/${repo}/contents/package.json`).reply(404);
		await packageHandler({ search: 'something', json: true });

		const log = JSON.parse(console.log.mock.calls[0][0]);
		expect(log).toEqual({
			type: 'error',
			filepath: 'package.json',
			repository: repo,
			search: 'something',
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
		standardInput = createStandardInput(repositoriesForStdIn);
		repositories.forEach(repo => {
			nockScope.get(`/${repo}/contents/package.json`).reply(200, {
				type: 'file',
				content: base64EncodeObj({
					name: `${repo}`
				}),
				path: 'package.json'
			});
		});
		await packageHandler({ search: 'name', limit: 2 });
		expect(console.log).toHaveBeenCalledTimes(numResults);
	});
});
