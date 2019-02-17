function Octokit () {}

Octokit.prototype.repos = {
	getContents: jest.fn().mockReturnValue({
		data {
			type: 'file',
			content: 'd2ViOiBuLWNsdXN0ZXIgc2VydmVyL2luaXQuanM=' //base64 encoding of 'web: n-cluster server/init.js'
		}
	})
};

module.exports = Octokit;
