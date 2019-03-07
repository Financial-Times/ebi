const createStandardInput = require('../helpers/create-standard-input');
const getRepositories = require('../../lib/get-repositories');

describe.each`
	input
	${undefined}
	${''}
	${'\n'}
`('getRepositories empty input', ({ input }) => {
	test(`has no repository`, () => {
		createStandardInput(input);

		const { repositories } = getRepositories({});
		expect(repositories).toEqual([]);
	});

	test(`has no error`, () => {
		createStandardInput(input);

		const { errors } = getRepositories({});
		expect(errors).toEqual([]);
	});
});

describe('getRepositories', () => {
	test('can run with no arguments', () => {
		expect(() => getRepositories()).not.toThrow();
	});

	test('works for single repository', () => {
		createStandardInput('Financial-Times/something');

		const {
			repositories: [repository]
		} = getRepositories({});
		expect(repository).toEqual('Financial-Times/something');
	});

	test('splits by newline', () => {
		createStandardInput(
			'Financial-Times/something\nFinancial-Times/something-else'
		);

		const {
			repositories: [firstRepo, secondRepo]
		} = getRepositories({});
		expect(firstRepo).toEqual('Financial-Times/something');
		expect(secondRepo).toEqual('Financial-Times/something-else');
	});

	test('ignores empty lines', () => {
		createStandardInput('Financial-Times/something\n\n');

		const { repositories } = getRepositories({});
		expect(repositories).toHaveLength(1);
	});

	test('filters repos that are in the wrong format', () => {
		createStandardInput('something');

		const { repositories } = getRepositories({});
		expect(repositories).toHaveLength(0);
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
	${'something/something/'}                       | ${[{ repository: 'something/something/', line: 1 }]}
	${'/something/something'}                       | ${[{ repository: '/something/something', line: 1 }]}
	${'owner/good1\nbad-one\nowner/good2\nbad-two'} | ${[{ repository: 'bad-one', line: 2 }, { repository: 'bad-two', line: 4 }]}
`(`getRepositories errors for '$input'`, ({ input, expectedErrors }) => {
	test(`returns error`, () => {
		createStandardInput(input);

		const { errors } = getRepositories({});
		expect(errors).toEqual(expectedErrors);
	});
});
