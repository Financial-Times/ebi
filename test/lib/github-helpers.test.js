const {
	extractOwnerAndRepo,
	SUPPORTED_REPO_STRING_PATTERNS
} = require('../../lib/github-helpers');

const expectedOwner = 'github-organization';
const expectedRepo = 'github-repo-name';

const supportedRepoStrings = SUPPORTED_REPO_STRING_PATTERNS;

const unsupportedRepoStrings = [
	`https://github.com/${expectedOwner}`,
	`this is junk subdomain.github.com/${expectedOwner}/${expectedRepo}`,
	`this is absolute/rubbish that we will not support`
];

afterEach(() => {
	jest.clearAllMocks();
});

supportedRepoStrings.forEach(githubRepoString => {
	test(
		'calling `extractOwnerAndRepo` with `' +
			githubRepoString +
			'` returns `owner` and `repo`',
		() => {
			const { owner, repo } = extractOwnerAndRepo(githubRepoString);

			expect(owner).toEqual(expectedOwner);
			expect(repo).toEqual(expectedRepo);
		}
	);
});

unsupportedRepoStrings.forEach(githubRepoString => {
	test(
		'calling `extractOwnerAndRepo` with `' +
			githubRepoString +
			'` will throw an error',
		() => {
			expect(() => {
				extractOwnerAndRepo(githubRepoString);
			}).toThrowError('Could not extract owner and repo');
		}
	);
});
