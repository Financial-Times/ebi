/*eslint no-console: ["error", { allow: ["log", "error"] }] */
const { flow } = require('lodash');

const { packageSearch } = require('../../lib/ebi/package-search');
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

exports.command = 'package [search] [repo..]';
exports.desc = 'Search within the `package.json` file';

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
	return baseConfig(yargs).positional('search', {
		type: 'string',
		describe:
			'What to search for. If empty returns whether `package.json` exists or not'
	});
};

exports.handler = function({
	token,
	search,
	limit,
	regex,
	json,
	verbose,
	repo: repoList
} = {}) {
	return ebiLog({
		ebiSearch: packageSearch({
			token,
			search,
			regex,
			limit
		}),
		json,
		verbose
	})(repoList);
};
