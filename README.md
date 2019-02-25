# 🦐 Ebi: GitHub repositories contents search

<a href="https://circleci.com/gh/Financial-Times/ebi/tree/master">
	<img alt="Build Status" src="https://circleci.com/gh/Financial-Times/ebi/tree/master.svg?style=svg">
</a>

A command line tool that searches the contents of you GitHub repositories.

Ebi is [Japanese for prawn/shrimp](<[https://translate.google.com/#view=home&op=translate&sl=en&tl=ja&text=Prawn](https://translate.google.com/#en/ja/Prawn)>), and intends to be a small little tool to crawl through your sea of code on GitHub, finding you nuggets of information.

## Usage

**NOTE:** To use this tool you will need a [GitHub personal access token](#github-personal-access-token-security) with all `repo` scopes.

```
$ <newline_separated_list_of_repositories> | ./bin/ebi.js <command>
```

### Examples

Show help

    ./bin/ebi.js --help

Determine whether a repo has a `Procfile`

```
$ echo -e "Financial-Times/next-search-page\nFinancial-Times/next-gdpr-tests" | ./bin/ebi.js --token $GITHUB_PERSONAL_ACCESS_TOKEN contents Procfile
Financial-Times/next-search-page
404 ERROR: file 'Procfile' not found in 'Financial-Times/next-gdpr-tests'
```

Find all the `node` engines and their versions in `package.json`

```
echo -e "Financial-Times/next-search-page\nFinancial-Times/next-gdpr-tests" | ./bin/ebi.js --token $GITHUB_PERSONAL_ACCESS_TOKEN package:engines
Financial-Times/next-search-page	node@8.15.0
Financial-Times/next-gdpr-tests	node@^8.9.4	npm@5.7.1
```

## GitHub personal access token security

This tool requires a [GitHub personal access token](https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line/)
with all `repo` scopes. This is _very powerful_ as it has access to modify a
repository's settings, so it is strongly recommended that you store this token
securely.

Once you have created a [new GitHub personal access token with all `repo` scopes](https://github.com/settings/tokens/new?description=Manage%20GitHub%20Apps%20CLI&scopes=repo 'Click here to create a new GitHub personal access token'),
you can store it in an environment variable and pass it to `manage-github-apps`
whenever you run a command that requires the `--token` option:

```sh
--token $GITHUB_PERSONAL_ACCESS_TOKEN
```

You should avoid passing your GitHub personal access token directly to any CLI
arguments as then it will be visible in your shell history.

A recommended approach is to store auth tokens in your operating system's
password management system (e.g. Keychain on macOS), retrieve it in your shell's
rcfile (e.g. `~/.bashrc`) and assign it to an environment variable so that it is
available to any shell that you run.

## Code formatting with Prettier

This repo uses [prettier](https://prettier.io/) for code formatting. To make the most of this when working locally:

-   Install the `prettier-vscode` extension in the extension side bar
-   Update your settings to format files on save, this will check your file meets the prettier guidelines and will fix it if it doesn't each time you save it. You can update the format on save setting at `Code` --> `Settings` --> update `"editor.formatOnSave": true`
