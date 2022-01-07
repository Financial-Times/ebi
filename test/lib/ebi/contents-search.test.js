const nock = require('nock');

const { base64Encode } = require('../../helpers/base64');
const { contentsSearch } = require('../../../lib/ebi/contents-search');
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

describe('contentsSearch resultsAsync', () => {
	test('empty filepath', async () => {
		const repo = 'Financial-Times/ebi';
		await expect(contentsSearch()([repo])).rejects.toThrow(
			/'filepath' is required/
		);
	});

	test('search results found', async () => {
		const repo = 'Financial-Times/ebi';
		nockScope.get(`/${repo}/contents/Procfile`).reply(200, {
			type: 'file',
			content: base64Encode('web: node --max-http-header-size=80000 server/cluster.js'),
			path: 'Procfile'
		});

		const ebiSearch = contentsSearch({
			search: 'web:',
			filepath: 'Procfile'
		});
		const { resultsAsync } = await ebiSearch([repo]);
		const [result] = resultsAsync;

		await expect(result).resolves.toEqual({
			filepath: 'Procfile',
			fileContents: 'web: node --max-http-header-size=80000 server/cluster.js',
			regex: undefined,
			repository: 'Financial-Times/ebi',
			search: 'web:',
			type: RESULT_TYPES.match
		});
	});

	test('regex results found', async () => {
		const repo = 'Financial-Times/ebi';
		nockScope.get(`/${repo}/contents/Procfile`).reply(200, {
			type: 'file',
			content: base64Encode('web: node --max-http-header-size=80000 server/cluster.js'),
			path: 'Procfile'
		});

		const ebiSearch = contentsSearch({
			regex: 'w..:',
			filepath: 'Procfile'
		});
		const { resultsAsync } = await ebiSearch([repo]);
		const [result] = resultsAsync;

		await expect(result).resolves.toEqual({
			filepath: 'Procfile',
			fileContents: 'web: node --max-http-header-size=80000 server/cluster.js',
			regex: 'w..:',
			repository: 'Financial-Times/ebi',
			search: undefined,
			type: RESULT_TYPES.match
		});
	});

	test('regex used if search is present', async () => {
		const repo = 'Financial-Times/ebi';
		nockScope.get(`/${repo}/contents/Procfile`).reply(200, {
			type: 'file',
			content: base64Encode('web: node --max-http-header-size=80000 server/cluster.js'),
			path: 'Procfile'
		});

		const ebiSearch = contentsSearch({
			regex: 'w..:',
			search: 'nope',
			filepath: 'Procfile'
		});
		const { resultsAsync } = await ebiSearch([repo]);
		const [result] = resultsAsync;

		await expect(result).resolves.toEqual({
			filepath: 'Procfile',
			fileContents: 'web: node --max-http-header-size=80000 server/cluster.js',
			regex: 'w..:',
			repository: 'Financial-Times/ebi',
			search: 'nope',
			type: RESULT_TYPES.match
		});
	});

	test('results not found', async () => {
		const repo = 'Financial-Times/ebi';
		nockScope.get(`/${repo}/contents/Procfile`).reply(200, {
			type: 'file',
			content: base64Encode('web: node --max-http-header-size=80000 server/cluster.js'),
			path: 'Procfile'
		});

		const ebiSearch = contentsSearch({
			search: 'worker',
			filepath: 'Procfile'
		});
		const { resultsAsync } = await ebiSearch([repo]);
		const [result] = resultsAsync;

		await expect(result).resolves.toEqual({
			message:
				"INFO: 'Procfile' has no match for 'worker' in 'Financial-Times/ebi'",
			filepath: 'Procfile',
			fileContents: 'web: node --max-http-header-size=80000 server/cluster.js',
			regex: undefined,
			repository: 'Financial-Times/ebi',
			search: 'worker',
			type: RESULT_TYPES.noMatch
		});
	});

	test('file not found', async () => {
		const repo = 'Financial-Times/ebi';
		nockScope.get(`/${repo}/contents/Procfile`).reply(404);

		const ebiSearch = contentsSearch({
			search: 'web:',
			filepath: 'Procfile'
		});
		const { resultsAsync } = await ebiSearch([repo]);
		const [result] = resultsAsync;

		await expect(result).rejects.toEqual({
			filepath: 'Procfile',
			error:
				"404 ERROR: file 'Procfile' not found in 'Financial-Times/ebi'",
			regex: undefined,
			repository: 'Financial-Times/ebi',
			search: 'web:',
			type: RESULT_TYPES.error
		});
	});
});

describe('contentsSearch getResults', () => {
	test('search matches', async () => {
		const repo = 'Financial-Times/ebi';
		nockScope.get(`/${repo}/contents/Procfile`).reply(200, {
			type: 'file',
			content: base64Encode('web: node --max-http-header-size=80000 server/cluster.js'),
			path: 'Procfile'
		});

		const ebiSearch = contentsSearch({
			search: 'web:',
			filepath: 'Procfile'
		});
		const { getResults } = await ebiSearch([repo]);
		const {
			allResults,
			searchMatches,
			searchNoMatches,
			searchErrors
		} = await getResults();

		const expectedResult = {
			filepath: 'Procfile',
			fileContents: 'web: node --max-http-header-size=80000 server/cluster.js',
			regex: undefined,
			repository: 'Financial-Times/ebi',
			search: 'web:',
			type: RESULT_TYPES.match
		};

		expect(allResults).toEqual([expectedResult]);
		expect(searchMatches).toEqual([expectedResult]);
		expect(searchNoMatches).toEqual([]);
		expect(searchErrors).toEqual([]);
	});

	test('search no matches', async () => {
		const repo = 'Financial-Times/ebi';
		nockScope.get(`/${repo}/contents/Procfile`).reply(200, {
			type: 'file',
			content: base64Encode('web: node --max-http-header-size=80000 server/cluster.js'),
			path: 'Procfile'
		});

		const ebiSearch = contentsSearch({
			search: 'something-else',
			filepath: 'Procfile'
		});
		const { getResults } = await ebiSearch([repo]);
		const {
			allResults,
			searchMatches,
			searchNoMatches,
			searchErrors
		} = await getResults();

		const expectedResult = {
			filepath: 'Procfile',
			fileContents: 'web: node --max-http-header-size=80000 server/cluster.js',
			regex: undefined,
			repository: 'Financial-Times/ebi',
			message:
				"INFO: 'Procfile' has no match for 'something-else' in 'Financial-Times/ebi'",
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
		nockScope.get(`/${repo}/contents/Procfile`).reply(404);

		const ebiSearch = contentsSearch({
			search: 'something',
			filepath: 'Procfile'
		});
		const { getResults } = await ebiSearch([repo]);
		const {
			allResults,
			searchMatches,
			searchNoMatches,
			searchErrors
		} = await getResults();

		const expectedResult = {
			filepath: 'Procfile',
			regex: undefined,
			repository: 'Financial-Times/ebi',
			error:
				"404 ERROR: file 'Procfile' not found in 'Financial-Times/ebi'",
			search: 'something',
			type: RESULT_TYPES.error
		};

		expect(allResults).toEqual([expectedResult]);
		expect(searchMatches).toEqual([]);
		expect(searchNoMatches).toEqual([]);
		expect(searchErrors).toEqual([expectedResult]);
	});
});
