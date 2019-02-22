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

describe('package command handler', () => {
	test('ignore empty strings', async () => {
		createStandardInput('');

		await packageHandler({ search: 'something' });
		expect(console.log).not.toBeCalled();
		expect(console.error).not.toBeCalled();
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

	test('<search> value not found, does not log', async () => {
		nockScope.get(`/${repo}/contents/package.json`).reply(200, {
			type: 'file',
			content: base64EncodeObj({
				name: 'next-front-page'
			}),
			path: 'package.json'
		});
		await packageHandler({ search: 'something-else' });
		expect(console.log).not.toBeCalled();
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
