const createStandardInput = require('../helpers/create-standard-input');
const getRepositories = require('../../lib/get-repositories');

describe('getRepositories', () => {
	test('no input', () => {
		createStandardInput();

		const { repositories } = getRepositories();
		expect(repositories).toEqual([]);
	});

	test('works for single repository', () => {
		createStandardInput('something');

		const {
			repositories: [repository]
		} = getRepositories();
		expect(repository).toEqual('something');
	});

	test('splits by newline', () => {
		createStandardInput('something\nsomething-else');

		const {
			repositories: [firstRepo, secondRepo]
		} = getRepositories();
		expect(firstRepo).toEqual('something');
		expect(secondRepo).toEqual('something-else');
	});

	test('ignores empty lines', () => {
		createStandardInput('something\n\n');

		const { repositories } = getRepositories();
		expect(repositories).toHaveLength(1);
	});
});
