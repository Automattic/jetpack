global.wp = {
	i18n: {
		__: jest.fn().mockImplementation( str => str ),
		_n: jest
			.fn()
			.mockImplementation( ( single, plural, number ) => ( number === 1 ? single : plural ) ),
	},
};
