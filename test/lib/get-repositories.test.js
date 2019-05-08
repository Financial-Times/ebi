const setupReadline = require('../helpers/setup-readline');
const getRepositories = require('../../lib/get-repositories');

/**
 * Get repositories with clean up of readline
 *
 * @param {string} input - standard input string
 * @param {any} args - `getRepositories` arguments
 * @param {any} setupReadlineArgs - `setupReadline` arguments
 */
const getRepositoriesWithCleanup = async ({
	input,
	args,
	setupReadlineArgs
}) => {
	const { readString, teardown } = setupReadline(setupReadlineArgs);

	const getRepos = getRepositories(args);
	readString(input);
	const { errors, repositories } = await getRepos;
	teardown();

	return { errors, repositories };
};

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
		const { repositories } = await getRepositoriesWithCleanup({
			input,
			args: {}
		});

		expect(repositories).toEqual([]);
	});

	test(`has no error`, async () => {
		const { errors } = await getRepositoriesWithCleanup({
			input,
			args: {}
		});

		expect(errors).toEqual([]);
	});
});

describe('getRepositories', () => {
	test('can run with no arguments', () => {
		expect(() => getRepositories()).not.toThrow();
	});

	test('works for single repository', async () => {
		const {
			repositories: [repository]
		} = await getRepositoriesWithCleanup({
			input: 'Financial-Times/something',
			args: {}
		});

		expect(repository).toEqual('Financial-Times/something');
	});

	test('works for full github repository links', async () => {
		const {
			repositories: [repository]
		} = await getRepositoriesWithCleanup({
			input: 'https://github.com/Financial-Times/something.git',
			args: {}
		});
		expect(repository).toEqual('Financial-Times/something');
	});

	test('splits by newline', async () => {
		const {
			repositories: [firstRepo, secondRepo]
		} = await getRepositoriesWithCleanup({
			input: 'Financial-Times/something\nFinancial-Times/something-else',
			args: {}
		});
		expect(firstRepo).toEqual('Financial-Times/something');
		expect(secondRepo).toEqual('Financial-Times/something-else');
	});

	test('ignores empty lines', async () => {
		const { repositories } = await getRepositoriesWithCleanup({
			input: 'Financial-Times/something\n\n',
			args: {}
		});
		expect(repositories).toHaveLength(1);
	});

	test('filters repos that are in the wrong format', async () => {
		const { repositories } = await getRepositoriesWithCleanup({
			input: 'something',
			args: {}
		});
		expect(repositories).toHaveLength(0);
	});

	test('takes repoList as an arg to provide repo array', async () => {
		const initialTTY = process.stdin.isTTY;
		process.stdin.isTTY = true;
		const { repositories } = await getRepositories({
			repoList: ['Financial-Times/something']
		});
		expect(repositories).toHaveLength(1);

		process.stdin.isTTY = initialTTY;
	});

	test('takes empty repoList as an arg and uses piped content', async () => {
		const {
			repositories: [repository]
		} = await getRepositoriesWithCleanup({
			input: 'Financial-Times/something',
			args: {
				repoList: []
			}
		});
		expect(repository).toEqual('Financial-Times/something');
	});

	test('providing stdin and repoList arg processes args then stdin', async () => {
		const { repositories } = await getRepositoriesWithCleanup({
			input: 'Financial-Times/something-else',
			args: { repoList: ['Financial-Times/something'] }
		});
		expect(repositories).toEqual([
			'Financial-Times/something',
			'Financial-Times/something-else'
		]);
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
		const { errors } = await getRepositoriesWithCleanup({
			input,
			args: {}
		});
		expect(errors).toEqual(expectedErrors);
	});
});
