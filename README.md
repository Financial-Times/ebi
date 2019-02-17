<h1 align="center">
	<img src="https://user-images.githubusercontent.com/51677/52789376-8d29e100-305b-11e9-83ac-c39dc692138f.png" width="120" alt="GitHub Repositories Contents Search"><br>
	grcs
	<a href="https://circleci.com/gh/Financial-Times/github-repositories-contents-search/tree/master">
		<img alt="Build Status" src="https://circleci.com/gh/Financial-Times/github-repositories-contents-search/tree/master.svg?style=svg">
	</a>
</h1>

Use the command line to search repositories for their contents

---

To use this tool you will need
a [GitHub personal access token](#github-personal-access-token-security)
with all `repo` scopes.

## Usage


```
$ <list_of_repositories> | ./bin/grcs.js <command>                        Search the contents of a list of repositories,
                                                                          where <list_of_repositories> is a carriage
									  return separated list of repositories in the
									  format {owner}/{repository name}

Commands:
	./bin/grcs.js contents [--token=<token>] <file> <search>          Search the contents of a given file in a list of
	                                                                  repositories for a given string
									  Where <token> is your personal github token,
									  <file> is the path of the file to be searched,
									  and <search> is the string to search for

```

### WIP: Current limitations
- Only runs locally
- Requires list of repositories to be piped in from `stdOut`
- See associated issues for list of commands / options still to be implemented

## GitHub personal access token security

This tool requires a [GitHub personal access token](https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line/)
with all `repo` scopes. This is _very powerful_ as it has access to modify a
repository's settings, so it is strongly recommended that you store this token
securely.

Once you have created a [new GitHub personal access token with all `repo` scopes](https://github.com/settings/tokens/new?description=Manage%20GitHub%20Apps%20CLI&scopes=repo "Click here to create a new GitHub personal access token"),
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