const yargs = require('yargs');
const nock = require('nock');
const fs = require('fs');

const contentsCommand = require('../../src/commands/contents');
const repo = 'Financial-Times/next-front-page';

jest.mock('fs');

describe('contents command handler', () => {
    const contentsHandler = contentsCommand.handler;

    beforeEach(() => {
        nockScope = nock('https://api.github.com/repos');
        jest.spyOn(console, 'error').mockImplementation().mockName('console.error');
        jest.spyOn(console, 'log').mockImplementation().mockName('console.log');
        fs.readFileSync.mockImplementation(() => repo);
    });

    afterEach(() => {
        nock.cleanAll();
        jest.resetAllMocks();
    });

    test('when contents handler is called with valid <file> and <search> values, a list of repositories are logged', async () => {
        nockScope.get(`/${repo}/contents/Procfile`)
            .reply(200, {
                type: 'file',
                content: 'd2ViOiBuLWNsdXN0ZXIgc2VydmVyL2luaXQuanM=', //base64 encoding of 'web: n-cluster server/init.js'
                path: 'Procfile'
            });
        await contentsHandler({file: 'Procfile', search: 'web'});
        expect(console.log).toBeCalledWith('Financial-Times/next-front-page');
    });

    test('when `contents` command is used with a <file> path that leads to a directory rather than a file, the relevant error is logged', async () => {
        nockScope.get(`/${repo}/contents/server`)
            .reply(200, [
                { path: 'app.js' },
                { path: 'libs' }
            ]);
        await contentsHandler({ file: 'server', search: 'app' });
        expect(console.error.mock.calls[0][0].message).toMatch(`'server' is not a file path`);
    });

    test('when `contents` command is used and a match is not found in a repo, the relevant error is logged for that repo', () => {
        //TODO
    });

    test('undefined repos - repo name isnt valid repo name', () => {
        //TODO
    });

})

