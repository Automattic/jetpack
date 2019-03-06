/**
 * External dependencies
 */
const wp = window.wp;
const { registerStore } = wp.data;

const DEFAULT_STATE = {
	nonce: null,
	importAuthors: [],
};

registerStore( 'wordpress-importer', {
	reducer( state = DEFAULT_STATE, action ) {
		switch ( action.type ) {
			case 'PROCESS_UPLOAD':
				return {
					...state,
					nonce: action.nonce,
					importAuthors: action.importAuthors,
				};
		}
		return state;
	},

	actions: {
		setUploadResult( result ) {
			return {
				type: 'PROCESS_UPLOAD',
				nonce: result.nonce,
				importAuthors: result.authors,
			};
		},
	},

	selectors: {
		getNonce( state ) {
			return state.nonce;
		},
		getImportAuthors( state ) {
			return state.importAuthors;
		},
	},
} );
