const { pathToFileURL } = require( 'url' );

module.exports = ( { types } ) => ( {
	visitor: {
		MemberExpression( nodePath, state ) {
			const { object, property } = nodePath.node;
			if (
				types.isMetaProperty( object ) &&
				object.meta.name === 'import' &&
				object.property.name === 'meta' &&
				types.isIdentifier( property, { name: 'url' } )
			) {
				nodePath.replaceWith( types.stringLiteral( pathToFileURL( state.filename ).href ) );
			}
		},
	},
} );
