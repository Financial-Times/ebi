const nock = require('nock');

const createStandardInput = require('../helpers/create-standard-input');
const { base64EncodeObj } = require('../helpers/base64');
const packageCommand = require('../../src/commands/package');
const repo = 'Financial-Times/next-front-page';

describe('package command handler', () => {
    let standardInput;
    const packageHandler = packageCommand.handler;

    beforeEach(() => {
        standardInput = createStandardInput(repo);
        nockScope = nock('https://api.github.com/repos');
        jest.spyOn(console, 'error').mockImplementation().mockName('console.error');
        jest.spyOn(console, 'log').mockImplementation().mockName('console.log');
    });

    afterEach(() => {
        nock.cleanAll();
        jest.resetAllMocks();
        standardInput.teardown();
    });

    test('repository not found', async () => {
        const invalidRepo = 'Financial-Times/invalid';
        standardInput = createStandardInput(invalidRepo);
        nockScope.get(`/${invalidRepo}/contents/package.json`)
            .reply(404, {
                message: 'Not Found'
            });
        await packageHandler({ search: 'something' });
        expect(console.error.mock.calls[0][0].message).toMatch('404 ERROR');
    });

    test('found <search> value logs repository', async () => {
        nockScope.get(`/${repo}/contents/package.json`)
            .reply(200, {
                type: 'file',
                content: base64EncodeObj({
                    name: 'next-front-page'
                }),
                path: 'package.json'
            });
        await packageHandler({ search: 'name' });
        expect(console.log).toBeCalledWith('Financial-Times/next-front-page');
    });

    test('<search> value not found, does not log', async () => {
        nockScope.get(`/${repo}/contents/package.json`)
            .reply(200, {
                type: 'file',
                content: base64EncodeObj({
                    name: 'next-front-page'
                }),
                path: 'package.json'
            });
        await packageHandler({ search: 'something-else' });
        expect(console.log).not.toBeCalled();
    });
});
