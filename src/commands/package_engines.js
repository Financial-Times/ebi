const fs = require('fs');

const getContents = require('../../lib/get-contents');

exports.command = 'package:engines [search]';
exports.desc = 'search for a string within the `package.json` engines field';

const processJson = (content) => {
    return JSON.parse(content);
};

const engineVersionDisplay = ({ name, engines }) => `${name}@${engines[name]}`;
// Report all engines in a tab separated format
// eg, "node@8.13.0  npm@6.8.0"
const enginesReport = engines => {
    return Object.keys(engines)
        .map(name => `${name}@${engines[name]}`)
        .join("\t");
};

exports.handler = function (argv = {}) {
    const { token } = argv;
    const repositories = fs.readFileSync('/dev/stdin').toString().split("\n");
    const path = 'package.json';

    const getPackageJson = getContents({
        githubToken: token,
        path
    });
    const allRepos = repositories.map(
        repository => getPackageJson(repository)
            .then(data => {
                try {
                    return processJson(data);
                } catch (error) {
                    throw new Error(`JSON PARSE ERROR: ${path} parse error in '${repository}'`);
                }
            })
            .then((json = {}) => {
                const { engines } = json;
                if (engines) {
                    const enginesOutput = enginesReport(engines);
                    console.log(`${repository}\t${enginesOutput}`);
                } else {
                    console.error(`NOT FOUND: engines field not found in '${path}' in '${repository}'`)
                }
                
            })
            .catch(error => {
                console.error(error);
            })
    );

    return Promise.all(allRepos);
};
