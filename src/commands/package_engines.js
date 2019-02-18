const fs = require('fs');

const getContents = require('../../lib/get-contents');

exports.command = 'package:engines [search]';
exports.desc = 'search for a string within the `package.json` engines field';

const processJson = (content) => {  
    return JSON.parse(content);
};

exports.handler = function (argv) {
    const { token, search } = argv;
    const repositories = fs.readFileSync('/dev/stdin').toString().split("\n");
    const path = 'package.json';

    const getPackageJson = getContents({
        githubToken: token,
        path
    });
    const allRepos = repositories.map(
        repository => getPackageJson(repository)
            .then((processJson))
            .catch(() => {
                console.error(`JSON PARSE ERROR: ${path} parse error in '${repository}'`)
            })
            .then((json = {}) => {
                const { engines } = json;
                if (engines) {
                    const enginesOutput = Object.keys(engines).reduce((prevEngineName, engineName, curIndex) => {
                        const prev = !!curIndex ? `${prevEngineName}@${engines[prevEngineName]}\t` : '';
                        return  `${prev}${engineName}@${engines[engineName]}`
                    }, '');
                    console.log(`${repository}\t${enginesOutput}`);
                } else {
                    console.error(`NOT FOUND: engines field not found in '${path}' in '${repository}'`)
                }
                
            })
    );

    return Promise.all(allRepos);
};
