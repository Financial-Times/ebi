# 🦐 Ebi: GitHub repositories contents search

<a href="https://circleci.com/gh/Financial-Times/ebi/tree/master">
	<img alt="Build Status" src="https://circleci.com/gh/Financial-Times/ebi/tree/master.svg?style=svg">
</a>

A command line tool that searches files within GitHub repositories.

Ebi (えび) is [Japanese for prawn/shrimp](https://translate.google.com/#view=home&op=translate&sl=en&tl=ja&text=Prawn), and intends to be a small little tool to crawl through your sea of code on GitHub, finding you nuggets of information.

## Usage

1.  [Set up a GitHub personal access token](#setting-up-your-github-personal-access-token) (with all `repo` scopes) assigned to the `GITHUB_PERSONAL_ACCESS_TOKEN` environment variable

2.  Pass in the list of space-separated repositories as arguments:

        npx ebi <command> Financial-Times/ebi Financial-Times/tako

### Examples

Show help

    npx ebi --help

Input the repositories to the ebi command either via `stdin` or `args`.
Determine whether a repo has a `Procfile`

```
$ echo -e "Financial-Times/ebi" | npx ebi contents Procfile
```

```
$ npx ebi contents Procfile Financial-Times/ebi
```

Find all the `node` engines and their versions in `package.json`

```
$ cat repositories.txt | npx ebi package:engines
```

For more examples see [Usage Examples](https://github.com/Financial-Times/ebi/wiki/Usage-Examples).

### JSON output

To output as JSON, you can use the `--json` flag eg, `npx ebi package:engines --json`.

The output format of the JSON is

```
{
    type,
    repository,
    filepath,
    fileContents,
    [search],
    [regex],
    [error]
}
```

| Field          | Values                            | Description                                                   |
| -------------- | --------------------------------- | ------------------------------------------------------------- |
| `type`         | `match`, `error`                  | Type of result. Non matches will be under `error`             |
| `repository`   | `Financial-Times/ebi`             | The full repository path                                      |
| `filepath`     | `package.json`                    | The filepath searched for                                     |
| `fileContents` | `{\n  \"name\": \"ebi\",\n ... }` | The file contents serialized as a string                      |
| `search`       | `name`                            | [optional] The search term                                    |
| `regex`        | `no.*`                            | [optional] The regex used for search (ie, `--regex`)          |
| `error`        | `404 ERROR: ...`                  | [optional] The error message if the result is of type `error` |

## Setting up your GitHub personal access token

This tool requires a [GitHub personal access token](https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line/) with all `repo` scopes. This is _very powerful_ as it has access to modify a repository's settings, so it is strongly recommended that you store this token securely.

1. Create a [new GitHub personal access token with all `repo` scopes](https://github.com/settings/tokens/new?description=Ebi%20CLI&scopes=repo)
2. Store the token in the `GITHUB_PERSONAL_ACCESS_TOKEN` environment variable. You should avoid passing your GitHub personal access token directly to any CLI arguments as it will be visible in your shell history. There are a few options to do this:
    1. If you work at Financial Times, you can follow the [GitHub personal access token docs](https://github.com/Financial-Times/next/wiki/How-to-store-and-access-a-GitHub-personal-access-token-securely)
    2. Use your operating system's password management system (e.g. Keychain on macOS) to store and retrieve `GITHUB_PERSONAL_ACCESS_TOKEN` in your shell's rcfile (e.g. `~/.bashrc`), then restart your terminal
    3. If all else fails, you can set it in your terminal with `GITHUB_PERSONAL_ACCESS_TOKEN=[github-token]`
    4. If you want use a different token, you can pass in `--token=$GITHUB_PERSONAL_ACCESS_TOKEN` when you run the commands

## Development

1.  Install [nvm](https://github.com/creationix/nvm) and use the correct node version

        nvm use

1.  Install dependencies

        npm install

1.  Run with:

        npx --package . ebi <command>

        # or,
        ./bin/ebi.js <command>

### Testing

To run linting and tests

    npm test

To just run linting

    npm run lint

To fix linting issues

    npm run lint-fix

To just run unit tests

    npm run unit-test

To watch files and run unit tests

    npm run unit-test:watch

To watch individual files and run unit tests

    npm run unit-test:watch -- [file...]
    # eg,
    npm run unit-test:watch -- test/lib/get-repositories.test.js

### Code formatting with Prettier

This repo uses [prettier](https://prettier.io/) for code formatting. To make the most of this when working locally:

-   Install the [`prettier-vscode`](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) extension in the extension side bar
-   Update your settings to format files on save. This will check your file meets the prettier guidelines and will fix it each time you save. You can update the setting at `Code` --> `Preferences` --> `Settings` --> update `"editor.formatOnSave": true`

To make sure no `eslint` rules conflict with the prettier config, we have [eslint-config-prettier](https://github.com/prettier/eslint-config-prettier). This can be run with:

    npm run eslint-check

### Publishing a release

CircleCI is set up to publish a release to `npm`. To release:

1. Create a [new release from GitHub](https://github.com/Financial-Times/ebi/releases/new)
    1. Tag it with a [semver](https://semver.org/) range and a `v` prefix eg, `v1.2.3` or `v1.4.5-beta.3`
    2. Create a title and description
    3. Publish release
2. Wait for CircleCI to finish building the tag release, and once done, it will be appear at [npmjs.com/package/ebi](https://www.npmjs.com/package/ebi)
