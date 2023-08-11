/**
 * External dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useEffect } from '@wordpress/element';
import { isEmpty, filter, first, map, pick, isNil } from 'lodash';

export const useSharedFieldAttributes = ( {
	attributes,
	clientId,
	setAttributes,
	sharedAttributes,
} ) => {
	const { updateBlockAttributes } = useDispatch( 'core/block-editor' );

	const siblings = useSelect(
		select => {
			const blockEditor = select( 'core/block-editor' );

			const parentId = first(
				blockEditor.getBlockParentsByBlockName( clientId, 'jetpack/contact-form' )
			);

			return filter(
				blockEditor.getBlocks( parentId ),
				block => block.name.indexOf( 'jetpack/field' ) > -1 && block.attributes.shareFieldAttributes
			);
		},
		[ clientId ]
	);

	useEffect( () => {
		if ( ! isEmpty( siblings ) && attributes.shareFieldAttributes ) {
			const newSharedAttributes = pick( first( siblings ).attributes, sharedAttributes );
			updateBlockAttributes( [ clientId ], newSharedAttributes );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	return useCallback(
		newAttributes => {
			let blocksToUpdate;
			let newSharedAttributes;

			if ( attributes.shareFieldAttributes && isNil( newAttributes.shareFieldAttributes ) ) {
				blocksToUpdate = map( siblings, block => block.clientId );
				newSharedAttributes = pick( newAttributes, sharedAttributes );
			} else if ( newAttributes.shareFieldAttributes && ! isEmpty( siblings ) ) {
				blocksToUpdate = [ clientId ];
				newSharedAttributes = pick( first( siblings ).attributes, sharedAttributes );
			}

			if ( ! isEmpty( blocksToUpdate ) && ! isEmpty( newSharedAttributes ) ) {
				updateBlockAttributes( blocksToUpdate, newSharedAttributes );
			}

			setAttributes( newAttributes );
		},
		[ attributes, clientId, setAttributes, sharedAttributes, siblings, updateBlockAttributes ]
	);
};

export const withSharedFieldAttributes =
	sharedAttributes =>
	WrappedComponent =>
	( { attributes, clientId, setAttributes, ...props } ) => {
		const syncAttributes = useSharedFieldAttributes( {
			attributes,
			clientId,
			setAttributes,
			sharedAttributes,
		} );

		return (
			<WrappedComponent
				attributes={ attributes }
				clientId={ clientId }
				setAttributes={ syncAttributes }
				{ ...props }
			/>
		);
	};
