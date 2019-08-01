const { contentsSearch } = require('../lib/ebi');

// NOTE: Assumes you have `GITHUB_PERSONAL_ACCESS_TOKEN` environment variable set
const { GITHUB_PERSONAL_ACCESS_TOKEN } = process.env;

const repos = [
	'Financial-Times/ebi',
	'Financial-Times/tako',
	'Financial-Times/not-found-error'
];

const resultsSummary = results =>
	results.map(({ type, repository }) => `${type}: ${repository}`);

async function contentsResults() {
	const { getResults } = await contentsSearch({
		token: GITHUB_PERSONAL_ACCESS_TOKEN,
		filepath: 'package.json',
		search: 'ebi'
	})(repos);

	const {
		allResults,
		searchMatches,
		searchNoMatches,
		searchErrors
	} = await getResults();

	console.log('contentsSearch: searchMatches', resultsSummary(searchMatches));
	console.log(
		'contentsSearch: searchNoMatches',
		resultsSummary(searchNoMatches)
	);
	console.log('contentsSearch: searchErrors', resultsSummary(searchErrors));
	console.log('contentsSearch: allResults', resultsSummary(allResults));
}

async function contentsResultsAsync() {
	const { resultsAsync } = await contentsSearch({
		token: GITHUB_PERSONAL_ACCESS_TOKEN,
		filepath: 'package.json',
		search: 'ebi'
	})(repos);

	const allResults = await Promise.all(
		resultsAsync.map(promise => {
			return promise.catch(e => e);
		})
	);

	console.log('contentsSearchAsync: allResults', resultsSummary(allResults));
}

contentsResults();
contentsResultsAsync();
