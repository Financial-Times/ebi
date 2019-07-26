/*eslint no-console: ["error", { allow: ["log", "error"] }] */
const { flow } = require('lodash');

const {
	packageEnginesSearch
} = require('../../lib/ebi/package-engines-search');
const { ebiLog } = require('../../lib/ebi/ebi-log');
const {
	withEpilogue,
	withToken,
	withLimit,
	withRegex,
	withJson,
	withRepoList
} = require('./shared');

exports.command = 'package:engines [search] [repo..]';
exports.desc = 'Search `engines` field inside the `package.json` file';

exports.builder = yargs => {
	const baseConfig = flow([
		withEpilogue,
		withJson,
		withRegex,
		withToken,
		withLimit,
		withRepoList
	]);
	return baseConfig(yargs).positional('search', {
		type: 'string',
		describe: 'What to search for. If empty, returns all `engines`'
	});
};

exports.handler = async function({
	token,
	limit,
	search,
	regex,
	json,
	repo: repoList
} = {}) {
	return ebiLog({
		ebiSearch: packageEnginesSearch({
			token,
			search,
			regex,
			limit
		}),
		json
	})(repoList);
};
