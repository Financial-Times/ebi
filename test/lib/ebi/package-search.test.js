const nock = require('nock');

const { base64EncodeObj } = require('../../helpers/base64');
const { packageSearch } = require('../../../lib/ebi/package-search');
const { RESULT_TYPES } = require('../../../lib/ebi/result-types');

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

describe('packageSearch resultsAsync', () => {
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
		const { resultsAsync } = await ebiSearch([repo]);
		const [result] = resultsAsync;

		await expect(result).resolves.toEqual({
			filepath: 'package.json',
			fileContents: JSON.stringify(packageJson),
			regex: undefined,
			repository: 'Financial-Times/ebi',
			search: undefined,
			type: RESULT_TYPES.match
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
		const { resultsAsync } = await ebiSearch([repo]);
		const [result] = resultsAsync;

		await expect(result).resolves.toEqual({
			filepath: 'package.json',
			fileContents: JSON.stringify(packageJson),
			regex: undefined,
			repository: 'Financial-Times/ebi',
			search: 'ebi',
			type: RESULT_TYPES.match
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
		const { resultsAsync } = await ebiSearch([repo]);
		const [result] = resultsAsync;

		await expect(result).resolves.toEqual({
			filepath: 'package.json',
			fileContents: JSON.stringify(packageJson),
			regex: 'e.i',
			repository: 'Financial-Times/ebi',
			search: undefined,
			type: RESULT_TYPES.match
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
		const { resultsAsync } = await ebiSearch([repo]);
		const [result] = resultsAsync;

		await expect(result).resolves.toEqual({
			filepath: 'package.json',
			fileContents: JSON.stringify(packageJson),
			regex: 'e.i',
			repository: 'Financial-Times/ebi',
			search: 'nope',
			type: RESULT_TYPES.match
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
		const { resultsAsync } = await ebiSearch([repo]);
		const [result] = resultsAsync;

		await expect(result).resolves.toEqual({
			message:
				"INFO: 'package.json' has no match for 'something-else' in 'Financial-Times/ebi'",
			filepath: 'package.json',
			fileContents: JSON.stringify(packageJson),
			regex: undefined,
			repository: 'Financial-Times/ebi',
			search: 'something-else',
			type: RESULT_TYPES.noMatch
		});
	});

	test('file not found', async () => {
		const repo = 'Financial-Times/ebi';
		nockScope.get(`/${repo}/contents/package.json`).reply(404);

		const ebiSearch = packageSearch({
			search: 'ebi'
		});
		const { resultsAsync } = await ebiSearch([repo]);
		const [result] = resultsAsync;

		await expect(result).rejects.toEqual({
			filepath: 'package.json',
			error:
				"404 ERROR: file 'package.json' not found in 'Financial-Times/ebi'",
			regex: undefined,
			repository: 'Financial-Times/ebi',
			search: 'ebi',
			type: RESULT_TYPES.error
		});
	});
});

describe('packageSearch getResults', () => {
	let packageJson;
	beforeEach(() => {
		packageJson = {
			name: 'ebi'
		};
	});

	test('search matches', async () => {
		const repo = 'Financial-Times/ebi';
		nockScope.get(`/${repo}/contents/package.json`).reply(200, {
			type: 'file',
			content: base64EncodeObj(packageJson),
			path: 'package.json'
		});

		const ebiSearch = packageSearch({
			search: 'ebi'
		});
		const { getResults } = await ebiSearch([repo]);
		const {
			allResults,
			searchMatches,
			searchNoMatches,
			searchErrors
		} = await getResults();

		const expectedResult = {
			filepath: 'package.json',
			fileContents: JSON.stringify(packageJson),
			regex: undefined,
			repository: 'Financial-Times/ebi',
			search: 'ebi',
			type: RESULT_TYPES.match
		};

		expect(allResults).toEqual([expectedResult]);
		expect(searchMatches).toEqual([expectedResult]);
		expect(searchNoMatches).toEqual([]);
		expect(searchErrors).toEqual([]);
	});

	test('search no matches', async () => {
		const repo = 'Financial-Times/ebi';
		nockScope.get(`/${repo}/contents/package.json`).reply(200, {
			type: 'file',
			content: base64EncodeObj(packageJson),
			path: 'package.json'
		});

		const ebiSearch = packageSearch({
			search: 'something-else'
		});
		const { getResults } = await ebiSearch([repo]);
		const {
			allResults,
			searchMatches,
			searchNoMatches,
			searchErrors
		} = await getResults();

		const expectedResult = {
			filepath: 'package.json',
			fileContents: JSON.stringify(packageJson),
			message:
				"INFO: 'package.json' has no match for 'something-else' in 'Financial-Times/ebi'",
			regex: undefined,
			repository: 'Financial-Times/ebi',
			search: 'something-else',
			type: RESULT_TYPES.noMatch
		};

		expect(allResults).toEqual([expectedResult]);
		expect(searchMatches).toEqual([]);
		expect(searchNoMatches).toEqual([expectedResult]);
		expect(searchErrors).toEqual([]);
	});

	test('search errors', async () => {
		const repo = 'Financial-Times/ebi';
		nockScope.get(`/${repo}/contents/package.json`).reply(404);

		const ebiSearch = packageSearch({
			search: 'something'
		});
		const { getResults } = await ebiSearch([repo]);
		const {
			allResults,
			searchMatches,
			searchNoMatches,
			searchErrors
		} = await getResults();

		const expectedResult = {
			filepath: 'package.json',
			error:
				"404 ERROR: file 'package.json' not found in 'Financial-Times/ebi'",
			regex: undefined,
			repository: 'Financial-Times/ebi',
			search: 'something',
			type: RESULT_TYPES.error
		};

		expect(allResults).toEqual([expectedResult]);
		expect(searchMatches).toEqual([]);
		expect(searchNoMatches).toEqual([]);
		expect(searchErrors).toEqual([expectedResult]);
	});
});
