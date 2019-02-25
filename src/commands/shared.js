const withLimit = yargs => {
	return yargs.option('limit', {
		required: true,
		type: 'string',
		describe:
			'GitHub personal access token. Generate one from https://github.com/settings/tokens'
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
