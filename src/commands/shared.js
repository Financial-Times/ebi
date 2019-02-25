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

module.exports = { withLimit, withToken };
