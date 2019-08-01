const getRepositories = require('../../lib/get-repositories');
const getContents = require('../../lib/get-contents');
const {
	createResult,
	withMatchFileContents,
	withNoMatchMessageFileContents,
	withErrorMessage
} = require('../../lib/create-result');
const { getEbiResults } = require('./ebi-results');

exports.contentsSearch = ({
	filepath,
	token,
	search,
	regex,
	limit
} = {}) => async repoList => {
	if (!filepath) {
		throw new Error("'filepath' is required for contents search");
	}

	const { errors, repositories } = await getRepositories({
		limit,
		repoList
	});

	const getPathContents = getContents({
		githubToken: token,
		filepath
	});

	// get the contents of <filepath> for each repository
	const searchResults = repositories.map(repository => {
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

	return getEbiResults({
		errors,
		search,
		regex,
		filepath,
		searchResults
	});
};
