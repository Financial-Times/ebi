const nock = require('nock');

const { base64EncodeObj } = require('../../helpers/base64');
const { packageSearch } = require('../../../lib/ebi/package-search');

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

describe('packageSearch', () => {
	let packageJson;
	beforeEach(() => {
		packageJson = {
			name: 'ebi'
		};
	});

	test('empty search', async () => {
		const repo = 'Financial-Times/ebi';
		nockScope.get(`/${repo}/contents/package.json`).reply(200, {
			type: 'file',
			content: base64EncodeObj(packageJson),
			path: 'package.json'
		});

		const ebiSearch = packageSearch();
		const [result] = await ebiSearch([repo]);

		await expect(result).resolves.toEqual({
			filepath: 'package.json',
			fileContents: JSON.stringify(packageJson),
			regex: undefined,
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

		const ebiSearch = packageSearch({
			search: 'ebi'
		});
		const [result] = await ebiSearch([repo]);

		await expect(result).resolves.toEqual({
			filepath: 'package.json',
			fileContents: JSON.stringify(packageJson),
			regex: undefined,
			repository: 'Financial-Times/ebi',
			search: 'ebi',
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

		const ebiSearch = packageSearch({
			regex: 'e.i'
		});
		const [result] = await ebiSearch([repo]);

		await expect(result).resolves.toEqual({
			filepath: 'package.json',
			fileContents: JSON.stringify(packageJson),
			regex: 'e.i',
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

		const ebiSearch = packageSearch({
			regex: 'e.i',
			search: 'nope'
		});
		const [result] = await ebiSearch([repo]);

		await expect(result).resolves.toEqual({
			filepath: 'package.json',
			fileContents: JSON.stringify(packageJson),
			regex: 'e.i',
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

		const ebiSearch = packageSearch({
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

		const ebiSearch = packageSearch({
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
