const fs = require('fs');
const { pick, pickBy, merge } = require('lodash');

const getContents = require('../../lib/get-contents');

exports.command = 'package:engines [search]';
exports.desc = 'search for a string within the `package.json` engines field';

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
	const { token, search } = argv;
	const repositories = fs
		.readFileSync('/dev/stdin')
		.toString()
		.split('\n');
	const path = 'package.json';

	const getPackageJson = getContents({
		githubToken: token,
		path
	});
	const getJson = data => {
		try {
			return processJson(data);
		} catch (error) {
			throw new Error(
				`JSON PARSE ERROR: ${path} parse error in '${repository}'`
			);
		}
	};
	const throwIfNoEngines = (json = {}) => {
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
			.then(getJson)
			.then(throwIfNoEngines)
			.then(filterSearch)
			.then(engines => {
				const enginesOutput = enginesReport(engines);
				console.log(`${repository}\t${enginesOutput}`);
			})
			.catch(error => {
				console.error(error);
			})
	);

	return Promise.all(allRepos);
};
