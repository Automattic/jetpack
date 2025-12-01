const __create = Object.create;
const __defProp = Object.defineProperty;
const __getOwnPropDesc = Object.getOwnPropertyDescriptor;
const __getOwnPropNames = Object.getOwnPropertyNames;
const __getProtoOf = Object.getPrototypeOf;
const __hasOwnProp = Object.prototype.hasOwnProperty;
const __commonJS = ( cb, mod ) =>
	function __require() {
		return (
			mod || ( 0, cb[ __getOwnPropNames( cb )[ 0 ] ] )( ( mod = { exports: {} } ).exports, mod ),
			mod.exports
		);
	};
const __copyProps = ( to, from, except, desc ) => {
	if ( ( from && typeof from === 'object' ) || typeof from === 'function' ) {
		for ( const key of __getOwnPropNames( from ) )
			if ( ! __hasOwnProp.call( to, key ) && key !== except )
				__defProp( to, key, {
					get: () => from[ key ],
					enumerable: ! ( desc = __getOwnPropDesc( from, key ) ) || desc.enumerable,
				} );
	}
	return to;
};
const __toESM = ( mod, isNodeMode, target ) => (
	( target = mod != null ? __create( __getProtoOf( mod ) ) : {} ),
	__copyProps(
		// If the importer is in node compatibility mode or this is not an ESM
		// file that has been converted to a CommonJS file using a Babel-
		// compatible transform (i.e. "__esModule" has not been set), then set
		// "default" to the CommonJS "module.exports" for node compatibility.
		isNodeMode || ! mod || ! mod.__esModule
			? __defProp( target, 'default', { value: mod, enumerable: true } )
			: target,
		mod
	)
);

// package-external:@wordpress/data
const require_data = __commonJS( {
	'package-external:@wordpress/data'( exports, module ) {
		module.exports = window.wp.data;
	},
} );

// package-external:@wordpress/core-data
const require_core_data = __commonJS( {
	'package-external:@wordpress/core-data'( exports, module ) {
		module.exports = window.wp.coreData;
	},
} );

// routes/responses/route.tsx
const import_data = __toESM( require_data() );
const import_core_data = __toESM( require_core_data() );
const route = {
	/**
	 * Determines when to show the inspector panel.
	 * Only show when items are selected.
	 * @param root0
	 * @param root0.search
	 */
	inspector: async ( { search } ) => {
		return !! ( search?.responseIds && search.responseIds.length > 0 );
	},
	/**
	 * Preloads data before the route renders.
	 * @param root0
	 * @param root0.params
	 * @param root0.search
	 */
	loader: async ( { params, search } ) => {
		const status = params.view === 'spam' ? 'spam' : params.view === 'trash' ? 'trash' : 'publish';
		await ( 0, import_data.resolveSelect )( import_core_data.store ).getEntityRecords(
			'postType',
			'feedback',
			{
				per_page: 20,
				page: search.page || 1,
				status,
				orderby: 'date',
				order: 'desc',
			}
		);
	},
	/**
	 * Validates that the route can be accessed.
	 * Checks if the feedback post type exists.
	 */
	beforeLoad: async () => {
		try {
			await ( 0, import_data.resolveSelect )( import_core_data.store ).getPostType( 'feedback' );
		} catch {}
	},
};
export { route };
