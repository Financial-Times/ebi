const { flow } = require('lodash');

const { contentsSearch } = require('../../lib/ebi/contents-search');
const { ebiLog } = require('../../lib/ebi/ebi-log');
const {
	withEpilogue,
	withToken,
	withLimit,
	withRegex,
	withJson,
	withRepoList,
	withVerbose
} = require('./shared');

exports.command = 'contents <filepath> [search] [repo..]';

exports.describe = 'Search a file within a repository';

exports.builder = yargs => {
	const baseConfig = flow([
		withEpilogue,
		withJson,
		withRegex,
		withToken,
		withLimit,
		withRepoList,
		withVerbose
	]);
	return baseConfig(yargs)
		.positional('filepath', {
			type: 'string',
			describe: 'File path to search in GitHub contents API'
		})
		.positional('search', {
			type: 'string',
			describe:
				'What to search for. If empty, returns whether the file exists or not'
		});
};

exports.handler = ({
	filepath,
	token,
	search,
	regex,
	limit,
	json,
	verbose,
	repo: repoList
} = {}) => {
	return ebiLog({
		ebiSearch: contentsSearch({
			filepath,
			token,
			search,
			regex,
			limit
		}),
		json,
		verbose
	})(repoList);
};
