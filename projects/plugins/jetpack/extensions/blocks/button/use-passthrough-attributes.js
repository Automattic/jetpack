/**
 * External dependencies
 */
import { isEmpty, mapValues, pickBy } from 'lodash';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';

export default function usePassthroughAttributes( { attributes, clientId, setAttributes } ) {
	// `passthroughAttributes` is a map of child/parent attribute names,
	// to indicate which parent attribute values will be injected into which child attributes.
	// E.g. { childAttribute: 'parentAttribute' }
	const { passthroughAttributes } = attributes;

	const { attributesToSync } = useSelect( select => {
		const { getBlockAttributes, getBlockHierarchyRootClientId } = select( 'core/block-editor' );
		const parentAttributes = getBlockAttributes( getBlockHierarchyRootClientId( clientId ) );

		// Here we actually map the parent attribute value to the child attribute.
		// E.g. { childAttribute: 'foobar' }
		const mappedAttributes = mapValues( passthroughAttributes, key => parentAttributes[ key ] );

		// Discard all equals attributes
		const validAttributes = pickBy(
			mappedAttributes,
			( value, key ) => value !== attributes[ key ]
		);

		return { attributesToSync: validAttributes };
	} );

	useEffect( () => {
		if ( ! isEmpty( attributesToSync ) ) {
			setAttributes( attributesToSync );
		}
	}, [ attributesToSync, setAttributes ] );
}
