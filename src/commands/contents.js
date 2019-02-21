const getContents = require('../../lib/get-contents');
const getRepositories = require('../../lib/get-repositories');

exports.command =
	'contents [--token=<token>] [--limit=<limit>] <file> <search>';

exports.describe = 'search for a string within the repositories file';

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
				if (contents.includes(search)) {
					console.log(repository);
				}
			})
			.catch(error => {
				console.error(error.message);
			})
	);

	return Promise.all(allRepos);
};
