/*eslint no-console: ["error", { allow: ["log", "error"] }] */
const nock = require('nock');

const setupReadline = require('../helpers/setup-readline');
const { base64EncodeObj } = require('../helpers/base64');
const {
	handler: packageEnginesHandler
} = require('../../src/commands/package-engines');
const { RESULT_TYPES } = require('../../lib/ebi/result-types');
const repo = 'Financial-Times/next-front-page';

let nockScope;

const initializeHandlerForStdin = ({ repos, args }) => {
	const reposString = repos.join('\n');
	const { readString, teardown } = setupReadline(reposString);
	const handler = packageEnginesHandler(args);
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

describe('Log error for invalid repository (with verbose flag)', () => {
	const invalidRepository = 'something-invalid';

	test(`'${invalidRepository}'`, async () => {
		await initializeHandlerForStdin({
			repos: [invalidRepository],
			args: {
				verbose: true
			}
		});

		expect(console.error).toBeCalledWith(
			expect.stringContaining('invalid repository')
		);
	});

	test(`'${invalidRepository}' in json`, async () => {
		await initializeHandlerForStdin({
			repos: [invalidRepository],
			args: { json: true }
		});

		const log = JSON.parse(console.log.mock.calls[0][0]);
		expect(log).toEqual({
			type: RESULT_TYPES.error,
			filepath: 'package.json',
			repository: invalidRepository,
			error: expect.stringContaining('invalid repository')
		});
	});
});

describe('package:engines command handler', () => {
	test('ignore empty repositories', async () => {
		await initializeHandlerForStdin({
			repos: [],
			args: {}
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
			args: { verbose: true }
		});

		expect(console.error).toBeCalledWith(
			expect.stringContaining('404 ERROR')
		);
	});

	test('engines in package.json, logs repository and version', async () => {
		nockScope.get(`/${repo}/contents/package.json`).reply(200, {
			type: 'file',
			content: base64EncodeObj({
				engines: {
					node: '~10.15.0'
				}
			}),
			path: 'package.json'
		});

		await initializeHandlerForStdin({
			repos: [repo]
		});

		expect(console.log).toBeCalledWith(
			expect.stringContaining('Financial-Times/next-front-page')
		);
		expect(console.log).toBeCalledWith(expect.stringContaining('~10.15.0'));
	});

	test('when given <repoList> argument logs repository', async () => {
		nockScope.get(`/${repo}/contents/package.json`).reply(200, {
			type: 'file',
			content: base64EncodeObj({
				engines: {
					node: '~10.15.0'
				}
			}),
			path: 'package.json'
		});

		await initializeHandlerForStdin({
			repos: [repo]
		});

		expect(console.log).toBeCalledWith(
			expect.stringContaining('Financial-Times/next-front-page')
		);
		expect(console.log).toBeCalledWith(expect.stringContaining('~10.15.0'));
	});

	test('multiple engines in package.json, logs repositories and versions', async () => {
		nockScope.get(`/${repo}/contents/package.json`).reply(200, {
			type: 'file',
			content: base64EncodeObj({
				engines: {
					node: '~10.15.0',
					npm: '6.8.0'
				}
			}),
			path: 'package.json'
		});

		await initializeHandlerForStdin({
			repos: [repo]
		});

		expect(console.log).toBeCalledWith(
			expect.stringContaining('Financial-Times/next-front-page')
		);
		expect(console.log).toBeCalledWith(
			expect.stringContaining('node@~10.15.0')
		);
		expect(console.log).toBeCalledWith(
			expect.stringContaining('npm@6.8.0')
		);
	});

	test('search specific engine in package.json, only logs that repository and version', async () => {
		nockScope.get(`/${repo}/contents/package.json`).reply(200, {
			type: 'file',
			content: base64EncodeObj({
				engines: {
					node: '~10.15.0',
					npm: '6.8.0'
				}
			}),
			path: 'package.json'
		});

		await initializeHandlerForStdin({
			repos: [repo],
			args: {
				search: 'node'
			}
		});

		expect(console.log).toBeCalledWith(
			expect.stringContaining('Financial-Times/next-front-page')
		);
		expect(console.log).toBeCalledWith(
			expect.stringContaining('node@~10.15.0')
		);
		expect(console.log).not.toBeCalledWith(
			expect.stringContaining('npm@6.8.0')
		);
	});

	test('search specific engine in package.json, only shows repos that match', async () => {
		nockScope.get(`/${repo}/contents/package.json`).reply(200, {
			type: 'file',
			content: base64EncodeObj({
				engines: {
					node: '~10.15.0',
					npm: '6.8.0'
				}
			}),
			path: 'package.json'
		});

		await initializeHandlerForStdin({
			repos: [repo],
			args: {
				search: '8.0.0'
			}
		});

		expect(console.log).not.toBeCalledWith(
			expect.stringContaining('Financial-Times/next-front-page')
		);
	});

	test('search specific version number in package.json, only logs that repository and version', async () => {
		nockScope.get(`/${repo}/contents/package.json`).reply(200, {
			type: 'file',
			content: base64EncodeObj({
				engines: {
					node: '~10.15.0',
					npm: '6.8.0'
				}
			}),
			path: 'package.json'
		});

		await initializeHandlerForStdin({
			repos: [repo],
			args: {
				search: '6.8.0'
			}
		});

		expect(console.log).toBeCalledWith(
			expect.stringContaining('Financial-Times/next-front-page')
		);
		expect(console.log).not.toBeCalledWith(
			expect.stringContaining('node@~10.15.0')
		);
		expect(console.log).toBeCalledWith(
			expect.stringContaining('npm@6.8.0')
		);
	});

	test('engines value not found in package.json does not log', async () => {
		nockScope.get(`/${repo}/contents/package.json`).reply(200, {
			type: 'file',
			content: base64EncodeObj({}),
			path: 'package.json'
		});

		await initializeHandlerForStdin({
			repos: [repo]
		});

		expect(console.log).not.toBeCalled();
	});

	test('engines value not found in package.json logs to console error (with verbose flag)', async () => {
		nockScope.get(`/${repo}/contents/package.json`).reply(200, {
			type: 'file',
			content: base64EncodeObj({}),
			path: 'package.json'
		});

		await initializeHandlerForStdin({
			repos: [repo],
			args: { verbose: true }
		});

		expect(console.error).toBeCalledWith(
			expect.stringContaining('engines field not found')
		);
	});

	test('engines search not found in package.json, logs info message in console error (with verbose flag)', async () => {
		nockScope.get(`/${repo}/contents/package.json`).reply(200, {
			type: 'file',
			content: base64EncodeObj({ engines: {} }),
			path: 'package.json'
		});

		await initializeHandlerForStdin({
			repos: [repo],
			args: { verbose: true }
		});

		expect(console.error).toBeCalledWith(expect.stringContaining(repo));
		expect(console.error).toBeCalledWith(
			expect.stringContaining('no match')
		);
	});

	test('package.json not valid JSON (with verbose flag)', async () => {
		nockScope.get(`/${repo}/contents/package.json`).reply(200, {
			type: 'file',
			content: 'something-invalid',
			path: 'package.json'
		});

		await initializeHandlerForStdin({
			repos: [repo],
			args: { verbose: true }
		});

		expect(console.error).toBeCalledWith(
			expect.stringContaining('parse error')
		);
	});

	test('regex is used for name search', async () => {
		nockScope.get(`/${repo}/contents/package.json`).reply(200, {
			type: 'file',
			content: base64EncodeObj({
				engines: {
					node: '~10.15.0'
				}
			}),
			path: 'package.json'
		});

		await initializeHandlerForStdin({
			repos: [repo],
			args: {
				regex: 'no.*'
			}
		});

		expect(console.log).toBeCalledWith(expect.stringContaining(repo));
	});

	test('regex is used for version search', async () => {
		nockScope.get(`/${repo}/contents/package.json`).reply(200, {
			type: 'file',
			content: base64EncodeObj({
				engines: {
					node: '~10.15.0'
				}
			}),
			path: 'package.json'
		});

		await initializeHandlerForStdin({
			repos: [repo],
			args: {
				regex: '\\.15\\..*'
			}
		});

		expect(console.log).toBeCalledWith(expect.stringContaining(repo));
	});

	test('regex is not matched, logs error (with verbose flag)', async () => {
		nockScope.get(`/${repo}/contents/package.json`).reply(200, {
			type: 'file',
			content: base64EncodeObj({
				engines: {
					node: '~10.15.0'
				}
			}),
			path: 'package.json'
		});

		await initializeHandlerForStdin({
			repos: [repo],
			args: {
				regex: 'something$',
				verbose: true
			}
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
				engines: {
					node: '~10.15.0'
				}
			}),
			path: 'package.json'
		});

		await initializeHandlerForStdin({
			repos: [repo],
			args: {
				regex: 'something-else',
				search: 'node',
				verbose: true
			}
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
			engines: {
				node: '~10.15.0'
			}
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
			textSuffix: 'node@~10.15.0',
			filepath: 'package.json',
			engines: packageJson.engines,
			fileContents: JSON.stringify(packageJson),
			repository: repo
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
			args: { json: true, search: 'node' }
		});

		const log = JSON.parse(console.log.mock.calls[0][0]);
		expect(log).toEqual({
			type: RESULT_TYPES.match,
			textSuffix: 'node@~10.15.0',
			filepath: 'package.json',
			search: 'node',
			engines: packageJson.engines,
			fileContents: JSON.stringify(packageJson),
			repository: repo
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
			args: { json: true, regex: 'no.*' }
		});

		const log = JSON.parse(console.log.mock.calls[0][0]);
		expect(log).toEqual({
			type: RESULT_TYPES.match,
			textSuffix: 'node@~10.15.0',
			filepath: 'package.json',
			regex: 'no.*',
			engines: packageJson.engines,
			fileContents: JSON.stringify(packageJson),
			repository: repo
		});
	});

	test('shows json with no engines match', async () => {
		nockScope.get(`/${repo}/contents/package.json`).reply(200, {
			type: 'file',
			content: base64EncodeObj(packageJson),
			path: 'package.json'
		});

		await initializeHandlerForStdin({
			repos: [repo],
			args: { json: true, search: 'something-else' }
		});

		const log = JSON.parse(console.log.mock.calls[0][0]);
		expect(log).toEqual({
			type: RESULT_TYPES.noMatch,
			filepath: 'package.json',
			search: 'something-else',
			fileContents: JSON.stringify(packageJson),
			repository: repo,
			message: expect.stringContaining('no match')
		});
	});

	test('shows json with error', async () => {
		nockScope.get(`/${repo}/contents/package.json`).reply(404);

		await initializeHandlerForStdin({
			repos: [repo],
			args: { json: true }
		});

		const log = JSON.parse(console.log.mock.calls[0][0]);
		expect(log).toEqual({
			type: RESULT_TYPES.error,
			filepath: 'package.json',
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
			'Financial-Times/next-article'
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
					engines: {
						node: '~10.15.0'
					}
				}),
				path: 'package.json'
			});
		});

		await initializeHandlerForStdin({
			repos: repositories,
			args: { limit: 2 }
		});

		expect(console.log).toHaveBeenCalledTimes(numResults);
	});
});
