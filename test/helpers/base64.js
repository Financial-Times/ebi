const base64EncodeObj = obj =>
	Buffer.from(JSON.stringify(obj)).toString('base64');

module.exports = {
	base64EncodeObj
};
