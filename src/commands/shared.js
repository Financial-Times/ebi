const withLimit = yargs => {
	return yargs.option('limit', {
		type: 'number',
		describe: 'Limit the number of repositories to search for'
	});
};

const withToken = yargs => {
	return yargs.option('token', {
		required: true,
		type: 'string',
		describe:
			'GitHub personal access token. Generate one from https://github.com/settings/tokens'
	});
};

module.exports = { withLimit, withToken };
