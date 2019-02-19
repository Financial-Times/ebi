const nock = require('nock');

const createStandardInput = require('../helpers/create-standard-input');
const { base64EncodeObj } = require('../helpers/base64');
const packageEnginesCommand = require('../../src/commands/package_engines');
const repo = 'Financial-Times/next-front-page';

describe('package:engines command handler', () => {
	let standardInput;
	const packageEnginesHandler = packageEnginesCommand.handler;

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
		standardInput.teardown();
	});

	test('repository not found', async () => {
		const invalidRepo = 'Financial-Times/invalid';
		standardInput = createStandardInput(invalidRepo);
		nockScope.get(`/${invalidRepo}/contents/package.json`).reply(404, {
			message: 'Not Found'
		});
		await packageEnginesHandler();
		expect(console.error.mock.calls[0][0].message).toMatch('404 ERROR');
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

		expect(console.log.mock.calls[0][0]).toContain(
			'Financial-Times/next-front-page'
		);
		expect(console.log.mock.calls[0][0]).toContain('~10.15.0');
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

		expect(console.log.mock.calls[0][0]).toContain(
			'Financial-Times/next-front-page'
		);
		expect(console.log.mock.calls[0][0]).toContain('node@~10.15.0');
		expect(console.log.mock.calls[0][0]).toContain('npm@6.8.0');
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

		expect(console.log.mock.calls[0][0]).toContain(
			'Financial-Times/next-front-page'
		);
		expect(console.log.mock.calls[0][0]).toContain('node@~10.15.0');
		expect(console.log.mock.calls[0][0]).not.toContain('npm@6.8.0');
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

		expect(console.log.mock.calls[0][0]).toContain(
			'Financial-Times/next-front-page'
		);
		expect(console.log.mock.calls[0][0]).not.toContain('node@~10.15.0');
		expect(console.log.mock.calls[0][0]).toContain('npm@6.8.0');
	});

	test('engines value not found in package.json', async () => {
		nockScope.get(`/${repo}/contents/package.json`).reply(200, {
			type: 'file',
			content: base64EncodeObj({}),
			path: 'package.json'
		});
		await packageEnginesHandler();
		expect(console.log).not.toBeCalled();
	});
});
