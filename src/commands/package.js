const getContents = require('../../lib/get-contents');
const getRepositories = require('../../lib/get-repositories');

exports.command = 'package <search>';
exports.desc = 'search for a string within the `package.json` file';

exports.handler = function(argv) {
	const { token, search, limit } = argv;
	const repositories = getRepositories(limit);
	const path = 'package.json';

	const getPackageJson = getContents({
		githubToken: token,
		path
	});
	const allRepos = repositories.map(repository =>
		getPackageJson(repository)
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
