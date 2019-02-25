/*eslint no-console: ["error", { allow: ["log", "error"] }] */
const nock = require('nock');

const createStandardInput = require('../helpers/create-standard-input');
const { base64EncodeObj } = require('../helpers/base64');
const {
	handler: packageEnginesHandler
} = require('../../src/commands/package-engines');
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

describe('package:engines command handler', () => {
	test('ignore empty strings', async () => {
		createStandardInput('');

		await packageEnginesHandler();
		expect(console.log).not.toBeCalled();
		expect(console.error).not.toBeCalled();
	});

	test('repository not found', async () => {
		const invalidRepo = 'Financial-Times/invalid';
		standardInput = createStandardInput(invalidRepo);
		nockScope.get(`/${invalidRepo}/contents/package.json`).reply(404, {
			message: 'Not Found'
		});
		await packageEnginesHandler();
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
		await packageEnginesHandler();

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
		await packageEnginesHandler();

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
		await packageEnginesHandler({
			search: 'node'
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
		await packageEnginesHandler({
			search: '8.0.0'
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
		await packageEnginesHandler({
			search: '6.8.0'
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
		await packageEnginesHandler();
		expect(console.log).not.toBeCalled();
	});

	test('engines value not found in package.json logs to console error', async () => {
		nockScope.get(`/${repo}/contents/package.json`).reply(200, {
			type: 'file',
			content: base64EncodeObj({}),
			path: 'package.json'
		});
		await packageEnginesHandler();
		expect(console.error).toBeCalledWith(
			expect.stringContaining('engines field not found')
		);
	});

	test('engines search not found in package.json, logs info message in console error', async () => {
		nockScope.get(`/${repo}/contents/package.json`).reply(200, {
			type: 'file',
			content: base64EncodeObj({ engines: {} }),
			path: 'package.json'
		});
		await packageEnginesHandler();
		expect(console.error).toBeCalledWith(expect.stringContaining(repo));
		expect(console.error).toBeCalledWith(
			expect.stringContaining('no match')
		);
	});

	test('package.json not valid JSON', async () => {
		nockScope.get(`/${repo}/contents/package.json`).reply(200, {
			type: 'file',
			content: 'something-invalid',
			path: 'package.json'
		});
		await packageEnginesHandler();
		expect(console.error).toBeCalledWith(
			expect.stringContaining('parse error')
		);
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
		const repositoriesForStdIn = repositories.join('\n');
		standardInput = createStandardInput(repositoriesForStdIn);
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
		await packageEnginesHandler({ limit: 2 });
		expect(console.log).toHaveBeenCalledTimes(numResults);
	});
});
