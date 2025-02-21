// client-zip doesn't even try to work in jest. Mock it.
// https://github.com/Touffy/client-zip/issues/28
jest.mock(
	'client-zip',
	() => ( {
		downloadZip: jest.fn(),
	} ),
	{ virtual: true }
);
