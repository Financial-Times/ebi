const fs = require('fs');

jest.mock('fs');

const createStandardInput = data => {
	const mockReadFileSync = fs.readFileSync.mockImplementation(() => data);

	return {
		teardown: () => {
			mockReadFileSync.mockReset();
		}
	};
};

module.exports = createStandardInput;
