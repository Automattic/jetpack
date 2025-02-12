/**
 * External dependencies
 */
import { select, useDispatch } from '@wordpress/data';
import { useCallback, useEffect } from '@wordpress/element';
import { isEmpty, first, map, pick, isNil } from 'lodash';

export const useSharedFieldAttributes = ( {
	attributes,
	clientId,
	setAttributes,
	sharedAttributes,
} ) => {
	const { updateBlockAttributes } = useDispatch( 'core/block-editor' );

	// Not using `useSelect` here to get fresh sibling data within `useEffect` and `useCallback`.
	const getSiblings = useCallback( () => {
		const blockEditor = select( 'core/block-editor' );
		const parentId = first(
			blockEditor.getBlockParentsByBlockName( clientId, 'jetpack/contact-form' )
		);

		if ( ! parentId ) {
			return [];
		}

		const formDescendants = blockEditor.getClientIdsOfDescendants( parentId );

		return blockEditor
			.getBlocksByClientId( formDescendants )
			.filter(
				block =>
					block?.name?.includes( 'jetpack/field' ) &&
					block?.attributes?.shareFieldAttributes &&
					block?.clientId !== clientId
			);
	}, [ clientId ] );

	useEffect( () => {
		const siblings = getSiblings();

		if ( ! isEmpty( siblings ) && attributes.shareFieldAttributes ) {
			const newSharedAttributes = pick( first( siblings ).attributes, sharedAttributes );
			updateBlockAttributes( [ clientId ], newSharedAttributes );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	const updateAttributes = useCallback(
		newAttributes => {
			const siblings = getSiblings();

			let blocksToUpdate = [];
			let newSharedAttributes = {};

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
		[ attributes, clientId, getSiblings, setAttributes, sharedAttributes, updateBlockAttributes ]
	);

	return updateAttributes;
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
