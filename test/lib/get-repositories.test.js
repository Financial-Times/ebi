const createStandardInput = require('../helpers/create-standard-input');
const getRepositories = require('../../lib/get-repositories');

afterEach(() => {
	jest.resetAllMocks();
});

describe.each`
	input
	${undefined}
	${''}
	${'\n'}
`('getRepositories empty input', ({ input }) => {
	test(`has no repository`, async () => {
		createStandardInput(input);

		const { repositories } = await getRepositories({});
		expect(repositories).toEqual([]);
	});

	test(`has no error`, async () => {
		createStandardInput(input);

		const { errors } = await getRepositories({});
		expect(errors).toEqual([]);
	});
});

describe('getRepositories', () => {
	test('can run with no arguments', () => {
		expect(() => getRepositories()).not.toThrow();
	});

	test('works for single repository', async () => {
		createStandardInput('Financial-Times/something');

		const {
			repositories: [repository]
		} = await getRepositories({});
		expect(repository).toEqual('Financial-Times/something');
	});

	test('works for full github repository links', async () => {
		createStandardInput('https://github.com/Financial-Times/something.git');

		const {
			repositories: [repository]
		} = await getRepositories();
		expect(repository).toEqual('Financial-Times/something');
	});

	test('splits by newline', async () => {
		createStandardInput(
			'Financial-Times/something\nFinancial-Times/something-else'
		);

		const {
			repositories: [firstRepo, secondRepo]
		} = await getRepositories({});
		expect(firstRepo).toEqual('Financial-Times/something');
		expect(secondRepo).toEqual('Financial-Times/something-else');
	});

	test('ignores empty lines', async () => {
		createStandardInput('Financial-Times/something\n\n');

		const { repositories } = await getRepositories({});
		expect(repositories).toHaveLength(1);
	});

	test('filters repos that are in the wrong format', async () => {
		createStandardInput('something');

		const { repositories } = await getRepositories({});
		expect(repositories).toHaveLength(0);
	});

	test('takes repoList as an arg to provide repo array', async () => {
		process.stdin.isTTY = true;
		const { repositories } = await getRepositories({
			repoList: ['Financial-Times/something']
		});
		expect(repositories).toHaveLength(1);
		process.stdin.isTTY = false;
	});

	test('takes empty repoList as an arg and uses piped content', async () => {
		createStandardInput('Financial-Times/something');

		const {
			repositories: [repository]
		} = await getRepositories({
			repoList: []
		});
		expect(repository).toEqual('Financial-Times/something');
	});

	test('providing stdin and repoList arg produces error', () => {
		createStandardInput('Financial-Times/something');

		expect(() =>
			getRepositories({ repoList: ['Financial-Times/something'] })
		).toThrowError(
			'choose either to pipe through a repo list OR pass it as args'
		);
	});
});

describe.each`
	input                                           | expectedErrors
	${'something'}                                  | ${[{ repository: 'something', line: 1 }]}
	${'/'}                                          | ${[{ repository: '/', line: 1 }]}
	${'something/'}                                 | ${[{ repository: 'something/', line: 1 }]}
	${'/something'}                                 | ${[{ repository: '/something', line: 1 }]}
	${'/something/something'}                       | ${[{ repository: '/something/something', line: 1 }]}
	${'owner/good1\nbad-one\nowner/good2\nbad-two'} | ${[{ repository: 'bad-one', line: 2 }, { repository: 'bad-two', line: 4 }]}
`(`getRepositories errors for '$input'`, ({ input, expectedErrors }) => {
	test(`returns error`, async () => {
		createStandardInput(input);

		const { errors } = await getRepositories({});
		expect(errors).toEqual(expectedErrors);
	});
});
