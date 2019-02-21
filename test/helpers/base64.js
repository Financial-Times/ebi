const base64Encode = str => Buffer.from(str).toString('base64');

const base64EncodeObj = obj => base64Encode(JSON.stringify(obj));

module.exports = {
	base64Encode,
	base64EncodeObj
};
