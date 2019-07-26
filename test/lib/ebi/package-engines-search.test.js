const nock = require('nock');

const { base64EncodeObj } = require('../../helpers/base64');
const {
	packageEnginesSearch
} = require('../../../lib/ebi/package-engines-search');

let nockScope;
let initialTTY;

beforeAll(() => {
	// Set isTTY to `true`, so that standard input is ignored
	initialTTY = process.stdin.isTTY;
	process.stdin.isTTY = true;
});

beforeEach(() => {
	nockScope = nock('https://api.github.com/repos');
});

afterEach(() => {
	nock.cleanAll();
});

afterAll(() => {
	process.stdin.isTTY = initialTTY;
});

describe('packageEnginesSearch', () => {
	let packageJson;
	beforeEach(() => {
		packageJson = {
			engines: {
				node: '~10.15.0'
			}
		};
	});

	test('empty search', async () => {
		const repo = 'Financial-Times/ebi';
		nockScope.get(`/${repo}/contents/package.json`).reply(200, {
			type: 'file',
			content: base64EncodeObj(packageJson),
			path: 'package.json'
		});

		const ebiSearch = packageEnginesSearch();
		const [result] = await ebiSearch([repo]);

		await expect(result).resolves.toEqual({
			filepath: 'package.json',
			fileContents: JSON.stringify(packageJson),
			textSuffix: 'node@~10.15.0',
			regex: undefined,
			engines: packageJson.engines,
			repository: 'Financial-Times/ebi',
			search: undefined,
			type: 'match'
		});
	});

	test('search results found', async () => {
		const repo = 'Financial-Times/ebi';
		nockScope.get(`/${repo}/contents/package.json`).reply(200, {
			type: 'file',
			content: base64EncodeObj(packageJson),
			path: 'package.json'
		});

		const ebiSearch = packageEnginesSearch({
			search: 'node'
		});
		const [result] = await ebiSearch([repo]);

		await expect(result).resolves.toEqual({
			filepath: 'package.json',
			fileContents: JSON.stringify(packageJson),
			textSuffix: 'node@~10.15.0',
			regex: undefined,
			engines: packageJson.engines,
			repository: 'Financial-Times/ebi',
			search: 'node',
			type: 'match'
		});
	});

	test('regex results found', async () => {
		const repo = 'Financial-Times/ebi';
		nockScope.get(`/${repo}/contents/package.json`).reply(200, {
			type: 'file',
			content: base64EncodeObj(packageJson),
			path: 'package.json'
		});

		const ebiSearch = packageEnginesSearch({
			regex: 'n.de'
		});
		const [result] = await ebiSearch([repo]);

		await expect(result).resolves.toEqual({
			filepath: 'package.json',
			fileContents: JSON.stringify(packageJson),
			textSuffix: 'node@~10.15.0',
			regex: 'n.de',
			engines: packageJson.engines,
			repository: 'Financial-Times/ebi',
			search: undefined,
			type: 'match'
		});
	});

	test('regex used if search is present', async () => {
		const repo = 'Financial-Times/ebi';
		nockScope.get(`/${repo}/contents/package.json`).reply(200, {
			type: 'file',
			content: base64EncodeObj(packageJson),
			path: 'package.json'
		});

		const ebiSearch = packageEnginesSearch({
			regex: 'n.de',
			search: 'nope'
		});
		const [result] = await ebiSearch([repo]);

		await expect(result).resolves.toEqual({
			filepath: 'package.json',
			fileContents: JSON.stringify(packageJson),
			textSuffix: 'node@~10.15.0',
			regex: 'n.de',
			engines: packageJson.engines,
			repository: 'Financial-Times/ebi',
			search: 'nope',
			type: 'match'
		});
	});

	test('results not found', async () => {
		const repo = 'Financial-Times/ebi';
		nockScope.get(`/${repo}/contents/package.json`).reply(200, {
			type: 'file',
			content: base64EncodeObj(packageJson),
			path: 'package.json'
		});

		const ebiSearch = packageEnginesSearch({
			search: 'something-else'
		});
		const [result] = await ebiSearch([repo]);

		await expect(result).resolves.toEqual({
			message:
				"INFO: 'package.json' has no match for 'something-else' in 'Financial-Times/ebi'",
			filepath: 'package.json',
			fileContents: JSON.stringify(packageJson),
			regex: undefined,
			repository: 'Financial-Times/ebi',
			search: 'something-else',
			type: 'no-match'
		});
	});

	test('file not found', async () => {
		const repo = 'Financial-Times/ebi';
		nockScope.get(`/${repo}/contents/package.json`).reply(404);

		const ebiSearch = packageEnginesSearch({
			search: 'ebi'
		});
		const [result] = await ebiSearch([repo]);

		await expect(result).rejects.toEqual({
			filepath: 'package.json',
			error:
				"404 ERROR: file 'package.json' not found in 'Financial-Times/ebi'",
			regex: undefined,
			repository: 'Financial-Times/ebi',
			search: 'ebi',
			type: 'error'
		});
	});
});
