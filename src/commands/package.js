const fs = require('fs');

const getContents = require('../../lib/get-contents');

exports.command = 'package <search>';
exports.desc = 'search for a string within the `package.json` file';

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
            .then((contents) => {
                if (contents.includes(search)){
                    console.log(repository);
                }
            })
            .catch(error => {
                console.error(error);
            })
    );

    return Promise.all(allRepos);
};