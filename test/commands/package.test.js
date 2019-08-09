/*eslint no-console: ["error", { allow: ["log", "error"] }] */
const nock = require('nock');

const setupReadline = require('../helpers/setup-readline');
const { base64EncodeObj } = require('../helpers/base64');
const { handler: packageHandler } = require('../../src/commands/package');
const { RESULT_TYPES } = require('../../lib/ebi/result-types');
const repo = 'Financial-Times/next-front-page';

let nockScope;

const initializeHandlerForStdin = ({ repos, args }) => {
	const reposString = repos.join('\n');
	const { readString, teardown } = setupReadline(reposString);
	const handler = packageHandler(args);
	readString(reposString);

	return handler.then(teardown);
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

describe('Log error for invalid repository', () => {
	const invalidRepository = 'something-invalid';

	test(`'${invalidRepository}' (with verbose flag)`, async () => {
		await initializeHandlerForStdin({
			repos: [invalidRepository],
			args: { search: 'something', verbose: true }
		});

		expect(console.error).toBeCalledWith(
			expect.stringContaining('invalid repository')
		);
	});

	test(`'${invalidRepository}' in json`, async () => {
		await initializeHandlerForStdin({
			repos: [invalidRepository],
			args: { search: 'something', json: true }
		});

		const log = JSON.parse(console.log.mock.calls[0][0]);
		expect(log).toEqual({
			type: RESULT_TYPES.error,
			filepath: 'package.json',
			search: 'something',
			repository: invalidRepository,
			error: expect.stringContaining('invalid repository')
		});
	});
});

describe('Do not log info and errors by default', () => {
	const invalidRepository = 'something-invalid';

	test(`for error'`, async () => {
		await initializeHandlerForStdin({
			repos: [invalidRepository],
			args: { search: 'something' }
		});

		expect(console.log).not.toBeCalled();
		expect(console.error).not.toBeCalled();
	});

	test(`for info message`, async () => {
		nockScope.get(`/${repo}/contents/package.json`).reply(200, {
			type: 'file',
			content: base64EncodeObj({}),
			path: 'package.json'
		});

		await initializeHandlerForStdin({
			repos: [repo],
			args: { search: 'something-else' }
		});

		expect(console.log).not.toBeCalled();
		expect(console.error).not.toBeCalled();
	});
});

describe('package command handler', () => {
	test('ignore empty string repositories', async () => {
		await initializeHandlerForStdin({
			repos: [],
			args: { search: 'something' }
		});

		expect(console.log).not.toBeCalled();
		expect(console.error).not.toBeCalled();
	});

	test('no arguments does nothing', async () => {
		await initializeHandlerForStdin({
			repos: []
		});

		expect(console.log).not.toBeCalled();
		expect(console.error).not.toBeCalled();
	});

	test('repository not found (with verbose flag)', async () => {
		const invalidRepo = 'Financial-Times/invalid';
		nockScope.get(`/${invalidRepo}/contents/package.json`).reply(404, {
			message: 'Not Found'
		});

		await initializeHandlerForStdin({
			repos: [invalidRepo],
			args: { search: 'something', verbose: true }
		});

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

		await initializeHandlerForStdin({
			repos: [repo],
			args: { search: 'name' }
		});

		expect(console.log).toBeCalledWith('Financial-Times/next-front-page');
	});

	test('when given <repoList> argument, logs found repository', async () => {
		nockScope.get(`/${repo}/contents/package.json`).reply(200, {
			type: 'file',
			content: base64EncodeObj({
				name: 'next-front-page'
			}),
			path: 'package.json'
		});

		await initializeHandlerForStdin({
			repos: [repo],
			args: { search: 'name', repoList: repo }
		});

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

		await initializeHandlerForStdin({
			repos: [repo],
			args: {}
		});

		expect(console.log).toBeCalledWith('Financial-Times/next-front-page');
	});

	test('<search> value not found, logs info message in console error (with verbose flag)', async () => {
		nockScope.get(`/${repo}/contents/package.json`).reply(200, {
			type: 'file',
			content: base64EncodeObj({
				name: 'next-front-page'
			}),
			path: 'package.json'
		});

		await initializeHandlerForStdin({
			repos: [repo],
			args: { search: 'something-else', verbose: true }
		});

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

		await initializeHandlerForStdin({
			repos: [repo],
			args: {
				// NOTE: the extra \'s are not needed on the command line
				regex: 'front-.*$'
			}
		});

		expect(console.log).toBeCalledWith(expect.stringContaining(repo));
	});

	test('regex is not matched, logs error (with verbose flag)', async () => {
		nockScope.get(`/${repo}/contents/package.json`).reply(200, {
			type: 'file',
			content: base64EncodeObj({
				name: 'next-front-page'
			}),
			path: 'package.json'
		});

		await initializeHandlerForStdin({
			repos: [repo],
			args: { regex: 'something$', verbose: true }
		});

		expect(console.log).not.toBeCalled();
		expect(console.error).toBeCalledWith(
			expect.stringContaining('no match')
		);
		expect(console.error).toBeCalledWith(expect.stringContaining(repo));
	});

	test('regex is used if search term also exists (with verbose flag)', async () => {
		nockScope.get(`/${repo}/contents/package.json`).reply(200, {
			type: 'file',
			content: base64EncodeObj({
				name: 'next-front-page'
			}),
			path: 'package.json'
		});

		await initializeHandlerForStdin({
			repos: [repo],
			args: { regex: 'something-else', search: 'front', verbose: true }
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

		await initializeHandlerForStdin({
			repos: [repo],
			args: { json: true }
		});

		const log = JSON.parse(console.log.mock.calls[0][0]);
		expect(log).toEqual({
			type: RESULT_TYPES.match,
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

		await initializeHandlerForStdin({
			repos: [repo],
			args: { search: 'name', json: true }
		});

		const log = JSON.parse(console.log.mock.calls[0][0]);
		expect(log).toEqual({
			type: RESULT_TYPES.match,
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

		await initializeHandlerForStdin({
			repos: [repo],
			args: { regex: 'front-.*', json: true }
		});

		const log = JSON.parse(console.log.mock.calls[0][0]);
		expect(log).toEqual({
			type: RESULT_TYPES.match,
			filepath: 'package.json',
			regex: 'front-.*',
			repository: repo,
			fileContents: JSON.stringify(packageJson)
		});
	});

	test('shows json with no match', async () => {
		nockScope.get(`/${repo}/contents/package.json`).reply(200, {
			type: 'file',
			content: base64EncodeObj(packageJson),
			path: 'package.json'
		});

		await initializeHandlerForStdin({
			repos: [repo],
			args: { search: 'something-else', json: true }
		});

		const log = JSON.parse(console.log.mock.calls[0][0]);
		expect(log).toEqual({
			type: RESULT_TYPES.noMatch,
			filepath: 'package.json',
			search: 'something-else',
			repository: repo,
			fileContents: JSON.stringify(packageJson),
			message: expect.stringContaining('no match')
		});
	});

	test('shows json error', async () => {
		nockScope.get(`/${repo}/contents/package.json`).reply(404);

		await initializeHandlerForStdin({
			repos: [repo],
			args: { search: 'something', json: true }
		});

		const log = JSON.parse(console.log.mock.calls[0][0]);
		expect(log).toEqual({
			type: RESULT_TYPES.error,
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
		repositories.forEach(repo => {
			nockScope.get(`/${repo}/contents/package.json`).reply(200, {
				type: 'file',
				content: base64EncodeObj({
					name: `${repo}`
				}),
				path: 'package.json'
			});
		});

		await initializeHandlerForStdin({
			repos: repositories,
			args: { search: 'name', limit: 2 }
		});

		expect(console.log).toHaveBeenCalledTimes(numResults);
	});
});
