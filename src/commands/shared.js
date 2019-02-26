const { GITHUB_PERSONAL_ACCESS_TOKEN } = process.env;

const withLimit = yargs => {
	return yargs.option('limit', {
		type: 'number',
		describe: 'Limit the number of repositories to search for'
	});
};

const withToken = yargs => {
	return yargs.option('token', {
		type: 'string',
		// NOTE: Use a function here, so the token is not displayed in the command line
		default: () => GITHUB_PERSONAL_ACCESS_TOKEN,
		describe:
			'GitHub personal access token (uses `GITHUB_PERSONAL_ACCESS_TOKEN` environment variable by default). Generate one from https://github.com/settings/tokens'
	});
};

const withRegex = yargs => {
	return yargs
		.option('regex', {
			type: 'string',
			describe: 'Regular expression to search by'
		})
		.check(({ regex, search }) => {
			const regexExists = !!regex;
			const searchExists = !!search;

			if (regexExists && searchExists) {
				throw new Error('Only use `search` or `regex`, not both');
			}

			return true;
		});
};

module.exports = { withLimit, withToken, withRegex };
