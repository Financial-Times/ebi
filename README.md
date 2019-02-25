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

Prerequisites

-   [Setting up your GitHub personal access token](#setting-up-your-github-personal-access-token)

Show help

    ./bin/ebi.js --help

Determine whether a repo has a `Procfile`

```
$ echo -e "Financial-Times/next-search-page\nFinancial-Times/next-gdpr-tests" | ./bin/ebi.js contents Procfile
Financial-Times/next-search-page
404 ERROR: file 'Procfile' not found in 'Financial-Times/next-gdpr-tests'
```

Find all the `node` engines and their versions in `package.json`

```
echo -e "Financial-Times/next-search-page\nFinancial-Times/next-gdpr-tests" | ./bin/ebi.js package:engines
Financial-Times/next-search-page	node@8.15.0
Financial-Times/next-gdpr-tests	node@^8.9.4	npm@5.7.1
```

## Setting up your GitHub personal access token

This tool requires a [GitHub personal access token](https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line/) with all `repo` scopes. This is _very powerful_ as it has access to modify a repository's settings, so it is strongly recommended that you store this token securely.

1. Create a [new GitHub personal access token with all `repo` scopes](https://github.com/settings/tokens/new?description=Ebi%20CLI&scopes=repo)
2. Store the token in the `GITHUB_PERSONAL_ACCESS_TOKEN` environment variable. You should avoid passing your GitHub personal access token directly to any CLI arguments as it will be visible in your shell history. There are a few options to do this:
    1. If you work at Financial Times, you can follow the [GitHub personal access token docs](https://github.com/Financial-Times/next/wiki/How-to-store-and-access-a-GitHub-personal-access-token-securely)
    2. Use your operating system's password management system (e.g. Keychain on macOS) to store and retrieve `GITHUB_PERSONAL_ACCESS_TOKEN` in your shell's rcfile (e.g. `~/.bashrc`), then restart your terminal
    3. If all else fails, you can set it in your terminal with `GITHUB_PERSONAL_ACCESS_TOKEN=[github-token]`
    4. If you want use a different token, you can pass in `--token=$GITHUB_PERSONAL_ACCESS_TOKEN` when you run the commands

## Code formatting with Prettier

This repo uses [prettier](https://prettier.io/) for code formatting. To make the most of this when working locally:

-   Install the `prettier-vscode` extension in the extension side bar
-   Update your settings to format files on save, this will check your file meets the prettier guidelines and will fix it if it doesn't each time you save it. You can update the format on save setting at `Code` --> `Settings` --> update `"editor.formatOnSave": true`
