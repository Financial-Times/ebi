const getRepositories = require('../../lib/get-repositories');
const getContents = require('../../lib/get-contents');
const {
	createResult,
	withMatchFileContents,
	withNoMatchMessageFileContents,
	withErrorMessage
} = require('../../lib/create-result');

exports.packageSearch = ({
	token,
	search,
	regex,
	limit
} = {}) => async repoList => {
	const { errors, repositories } = await getRepositories({ limit, repoList });
	const filepath = 'package.json';

	const getPackageJson = getContents({
		githubToken: token,
		filepath
	});

	const invalidRepos = errors.map(error => {
		const { repository, line } = error;
		const result = createResult({
			search,
			regex,
			filepath,
			repository
		});
		const message = `ERROR: invalid repository '${repository}' on line ${line}`;
		const output = result(withErrorMessage(message));
		return Promise.reject(output);
	});

	const allRepos = repositories.map(repository => {
		const result = createResult({
			search,
			regex,
			filepath,
			repository
		});
		return getPackageJson(repository)
			.then(contents => {
				const noSearch = !search;
				const containsSearchItem = contents.includes(search);
				let output;

				if (regex) {
					const regExp = new RegExp(regex);
					const hasMatch = contents.match(regExp);

					if (hasMatch) {
						output = result(withMatchFileContents(contents));
					} else {
						output = result(
							withNoMatchMessageFileContents({
								message: `INFO: '${filepath}' has no match for '${regExp}' in '${repository}'`,
								fileContents: contents
							})
						);
					}
				} else if (noSearch || containsSearchItem) {
					output = result(withMatchFileContents(contents));
				} else {
					output = result(
						withNoMatchMessageFileContents({
							message: `INFO: '${filepath}' has no match for '${search}' in '${repository}'`,
							fileContents: contents
						})
					);
				}

				return output;
			})

			.catch(error => {
				const { message } = error;
				const output = result(withErrorMessage(message));
				return Promise.reject(output);
			});
	});

	return invalidRepos.concat(allRepos);
};
