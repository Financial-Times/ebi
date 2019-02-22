/*eslint no-console: ["error", { allow: ["log", "error"] }] */
const { pick, pickBy, merge } = require('lodash');

const getContents = require('../../lib/get-contents');
const getRepositories = require('../../lib/get-repositories');
const { withToken, withLimit } = require('./shared');

exports.command = 'package:engines [search]';
exports.desc = 'Search `engines` field inside the `package.json` file';

exports.builder = yargs => {
	return withToken(withLimit(yargs)).positional('search', {
		type: 'string',
		describe: 'What to search for. If empty, returns all `engines`'
	});
};

const processJson = content => {
	return JSON.parse(content);
};

// Report all engines in a tab separated format
// eg, "node@8.13.0  npm@6.8.0"
const enginesReport = engines => {
	return Object.keys(engines)
		.map(name => `${name}@${engines[name]}`)
		.join('\t');
};

exports.handler = function(argv = {}) {
	const { token, limit, search } = argv;
	const path = 'package.json';
	const repositories = getRepositories(limit);

	const getPackageJson = getContents({
		githubToken: token,
		path
	});
	const getJson = repository => data => {
		try {
			return processJson(data);
		} catch (error) {
			throw new Error(
				`JSON PARSE ERROR: ${path} parse error in '${repository}'`
			);
		}
	};
	const throwIfNoEngines = repository => (json = {}) => {
		const { engines } = json;
		if (!engines) {
			throw new Error(
				`NOT FOUND: engines field not found in '${path}' in '${repository}'`
			);
		}
		return engines;
	};
	const filterSearch = engines => {
		if (search) {
			const foundKeys = Object.keys(engines).filter(name => {
				return name.includes(search);
			});
			const engineNameSearch = pick(engines, foundKeys);
			const engineVersionSearch = pickBy(engines, value => {
				return value.includes(search);
			});

			return merge(engineNameSearch, engineVersionSearch);
		} else {
			return engines;
		}
	};
	const allRepos = repositories.map(repository =>
		getPackageJson(repository)
			.then(getJson(repository))
			.then(throwIfNoEngines(repository))
			.then(filterSearch)
			.then(engines => {
				const enginesOutput = enginesReport(engines);
				const hasEngines = !!Object.keys(engines).length;
				if (hasEngines) {
					console.log(`${repository}\t${enginesOutput}`);
				} else {
					console.error(
						`INFO: '${path}' has no match for '${search}' in '${repository}'`
					);
				}
			})
			.catch(error => {
				console.error(error.message);
			})
	);

	return Promise.all(allRepos);
};
