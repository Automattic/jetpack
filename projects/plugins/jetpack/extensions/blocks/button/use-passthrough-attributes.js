import { useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { isEmpty } from 'lodash';

export default function usePassthroughAttributes( { attributes, clientId, setAttributes } ) {
	// `passthroughAttributes` is a map of child/parent attribute names,
	// to indicate which parent attribute values will be injected into which child attributes.
	// E.g. { childAttribute: 'parentAttribute' }
	const { passthroughAttributes } = attributes;
	const attributesToSync = useSelect(
		select => {
			// Get store instance once
			const store = select( 'core/block-editor' );
			const parentClientId = store.getBlockRootClientId( clientId );
			const parentAttributes = store.getBlockAttributes( parentClientId ) || {};

			// Only compute if we have both parent attributes and passthrough mappings
			if ( ! parentClientId || ! passthroughAttributes ) {
				return {};
			}

			// Create new object only if values are different
			let hasChanges = false;
			const validAttributes = {};

			// Check each attribute mapping
			Object.entries( passthroughAttributes ).forEach( ( [ childKey, parentKey ] ) => {
				const parentValue = parentAttributes[ parentKey ];
				if ( parentValue !== attributes[ childKey ] ) {
					hasChanges = true;
					validAttributes[ childKey ] = parentValue;
				}
			} );

			return hasChanges ? validAttributes : {};
		},
		[ clientId, passthroughAttributes, attributes ]
	);

	useEffect( () => {
		if ( ! isEmpty( attributesToSync ) ) {
			setAttributes( attributesToSync );
		}
	}, [ attributesToSync, setAttributes ] );
}
