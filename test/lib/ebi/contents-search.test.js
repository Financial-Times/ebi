const nock = require('nock');

const { base64Encode } = require('../../helpers/base64');
const { contentsSearch } = require('../../../lib/ebi/contents-search');

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

describe('contentsSearch', () => {
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
			content: base64Encode('web: n-cluster server/init.js'),
			path: 'Procfile'
		});

		const ebiSearch = contentsSearch({
			search: 'web:',
			filepath: 'Procfile'
		});
		const [result] = await ebiSearch([repo]);

		await expect(result).resolves.toEqual({
			filepath: 'Procfile',
			fileContents: 'web: n-cluster server/init.js',
			regex: undefined,
			repository: 'Financial-Times/ebi',
			search: 'web:',
			type: 'match'
		});
	});

	test('regex results found', async () => {
		const repo = 'Financial-Times/ebi';
		nockScope.get(`/${repo}/contents/Procfile`).reply(200, {
			type: 'file',
			content: base64Encode('web: n-cluster server/init.js'),
			path: 'Procfile'
		});

		const ebiSearch = contentsSearch({
			regex: 'w..:',
			filepath: 'Procfile'
		});
		const [result] = await ebiSearch([repo]);

		await expect(result).resolves.toEqual({
			filepath: 'Procfile',
			fileContents: 'web: n-cluster server/init.js',
			regex: 'w..:',
			repository: 'Financial-Times/ebi',
			search: undefined,
			type: 'match'
		});
	});

	test('regex used if search is present', async () => {
		const repo = 'Financial-Times/ebi';
		nockScope.get(`/${repo}/contents/Procfile`).reply(200, {
			type: 'file',
			content: base64Encode('web: n-cluster server/init.js'),
			path: 'Procfile'
		});

		const ebiSearch = contentsSearch({
			regex: 'w..:',
			search: 'nope',
			filepath: 'Procfile'
		});
		const [result] = await ebiSearch([repo]);

		await expect(result).resolves.toEqual({
			filepath: 'Procfile',
			fileContents: 'web: n-cluster server/init.js',
			regex: 'w..:',
			repository: 'Financial-Times/ebi',
			search: 'nope',
			type: 'match'
		});
	});

	test('results not found', async () => {
		const repo = 'Financial-Times/ebi';
		nockScope.get(`/${repo}/contents/Procfile`).reply(200, {
			type: 'file',
			content: base64Encode('web: n-cluster server/init.js'),
			path: 'Procfile'
		});

		const ebiSearch = contentsSearch({
			search: 'node',
			filepath: 'Procfile'
		});
		const [result] = await ebiSearch([repo]);

		await expect(result).resolves.toEqual({
			message:
				"INFO: 'Procfile' has no match for 'node' in 'Financial-Times/ebi'",
			filepath: 'Procfile',
			fileContents: 'web: n-cluster server/init.js',
			regex: undefined,
			repository: 'Financial-Times/ebi',
			search: 'node',
			type: 'no-match'
		});
	});

	test('file not found', async () => {
		const repo = 'Financial-Times/ebi';
		nockScope.get(`/${repo}/contents/Procfile`).reply(404);

		const ebiSearch = contentsSearch({
			search: 'web:',
			filepath: 'Procfile'
		});
		const [result] = await ebiSearch([repo]);

		await expect(result).rejects.toEqual({
			filepath: 'Procfile',
			error:
				"404 ERROR: file 'Procfile' not found in 'Financial-Times/ebi'",
			regex: undefined,
			repository: 'Financial-Times/ebi',
			search: 'web:',
			type: 'error'
		});
	});
});
