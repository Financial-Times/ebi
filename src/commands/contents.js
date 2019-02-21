const getContents = require('../../lib/get-contents');
const getRepositories = require('../../lib/get-repositories');

exports.command = 'contents <file> [search]';

exports.describe =
	'Search for a string within the repositories file. Returns whether the file exists if `search` is empty.';

exports.builder = yargs => {
	// TODO: this better
	return yargs;
};

exports.handler = argv => {
	const { file: path, token, search, limit } = argv;

	const repositories = getRepositories(limit);

	const getPathContents = getContents({
		githubToken: token,
		path
	});

	// get the contents of <file> for each repository
	const allRepos = repositories.map(repository =>
		getPathContents(repository)
			.then(contents => {
				const noSearch = !search;
				const containsSearchItem = contents.includes(search);

				if (noSearch || containsSearchItem) {
					console.log(repository);
				}
			})
			.catch(error => {
				console.error(error.message);
			})
	);

	return Promise.all(allRepos);
};
