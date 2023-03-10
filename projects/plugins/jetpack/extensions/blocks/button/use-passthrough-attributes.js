import { useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { isEmpty, mapValues, pickBy } from 'lodash';

export default function usePassthroughAttributes( { attributes, clientId, setAttributes } ) {
	// `passthroughAttributes` is a map of child/parent attribute names,
	// to indicate which parent attribute values will be injected into which child attributes.
	// E.g. { childAttribute: 'parentAttribute' }
	const { passthroughAttributes } = attributes;

	const { attributesToSync } = useSelect( select => {
		const { getBlockAttributes, getBlockRootClientId } = select( 'core/block-editor' );
		// Check the root block from which the block is nested, that is, the immediate parent.
		const parentClientId = getBlockRootClientId( clientId );
		const parentAttributes = getBlockAttributes( parentClientId ) || {};
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
