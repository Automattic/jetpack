/**
 * A type to represent the filters on the state.
 */
export type FilterObject = {
	uploader?: { [ id: string | number ]: boolean };
	privacy?: { [ value: string | number ]: boolean };
	rating?: { [ value: string ]: boolean };
};
