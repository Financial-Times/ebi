const GITHUB_REPO_REGEX = /^(?:\S*github\.com(?:\/|:))?([\w-]+)\/([\w-]+)/;

/**
 * Array of repo string patterns supported by `extractOwnerAndRepo`.
 *
 * @type {Array<string>}
 */
const SUPPORTED_REPO_STRING_PATTERNS = [
	'github-organization/github-repo-name',
	'github.com/github-organization/github-repo-name',
	'subdomain.github.com/github-organization/github-repo-name',
	'https://github.com/github-organization/github-repo-name',
	'https://github.com/github-organization/github-repo-name/blob/master',
	'https://github.com/github-organization/github-repo-name.git',
	'git+https://github.com/github-organization/github-repo-name.git',
	'git@github.com:github-organization/github-repo-name.git'
];

/**
 * Parses owner and repo from a supported list of string patterns defined by
 * `SUPPORTED_REPO_STRING_PATTERNS`.
 *
 * @param {string} githubRepoString
 * @returns {object} - Properties: owner, repo
 */
function extractOwnerAndRepo(githubRepoString) {
	const matches = GITHUB_REPO_REGEX.exec(githubRepoString);

	if (matches === null) {
		throw new Error(
			`ERROR: Could not extract owner and repo from provided string. The string must match one of the following patterns:\n\n- ${SUPPORTED_REPO_STRING_PATTERNS.join(
				'\n- '
			)}`
		);
	}
	const [, owner, repo] = matches;

	return { owner, repo };
}

module.exports = {
	GITHUB_REPO_REGEX,
	SUPPORTED_REPO_STRING_PATTERNS,
	extractOwnerAndRepo
};
