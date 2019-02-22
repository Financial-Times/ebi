const createStandardInput = require('../helpers/create-standard-input');
const getRepositories = require('../../lib/get-repositories');

describe('getRepositories', () => {
	test('works for single repository', () => {
		createStandardInput('something');

		const [repository] = getRepositories();
		expect(repository).toEqual('something');
	});

	test('splits by newline', () => {
		createStandardInput('something\nsomething-else');

		const [firstRepo, secondRepo] = getRepositories();
		expect(firstRepo).toEqual('something');
		expect(secondRepo).toEqual('something-else');
	});
});
