const getRepositories = require('../../lib/get-repositories');
const getContents = require('../../lib/get-contents');
const {
	createResult,
	withMatchFileContents,
	withErrorMessage
} = require('../../lib/create-result');

exports.contentsSearch = ({
	filepath,
	token,
	search,
	regex,
	limit
} = {}) => async repoList => {
	const { errors, repositories } = await getRepositories({
		limit,
		repoList
	});

	const getPathContents = getContents({
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

	// get the contents of <filepath> for each repository
	const allRepos = repositories.map(repository => {
		const result = createResult({
			search,
			regex,
			filepath,
			repository
		});
		return getPathContents(repository)
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
							withErrorMessage(
								`INFO: '${filepath}' has no match for '${regExp}' in '${repository}'`
							)
						);
					}
				} else if (noSearch || containsSearchItem) {
					output = result(withMatchFileContents(contents));
				} else {
					output = result(
						withErrorMessage(
							`INFO: '${filepath}' has no match for '${search}' in '${repository}'`
						)
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
