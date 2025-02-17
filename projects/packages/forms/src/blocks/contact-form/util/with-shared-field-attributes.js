/**
 * External dependencies
 */
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { useCallback, useEffect } from '@wordpress/element';
import { isEmpty, first, map, pick, isNil } from 'lodash';

export const useSharedFieldAttributes = ( {
	attributes,
	clientId,
	setAttributes,
	sharedAttributes,
} ) => {
	const registry = useRegistry();
	const { updateBlockAttributes, __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( 'core/block-editor' );

	const { getBlockParentsByBlockName, getClientIdsOfDescendants, getBlocksByClientId } =
		useSelect( 'core/block-editor' );

	const getSiblings = useCallback( () => {
		const parentId = first( getBlockParentsByBlockName( clientId, 'jetpack/contact-form' ) );

		if ( ! parentId ) {
			return [];
		}

		const formDescendants = getClientIdsOfDescendants( parentId );

		return getBlocksByClientId( formDescendants ).filter(
			block =>
				block?.name?.includes( 'jetpack/field' ) &&
				block?.attributes?.shareFieldAttributes &&
				block?.clientId !== clientId
		);
	}, [ clientId, getBlockParentsByBlockName, getClientIdsOfDescendants, getBlocksByClientId ] );

	useEffect( () => {
		const siblings = getSiblings();

		if ( ! isEmpty( siblings ) && attributes.shareFieldAttributes ) {
			const newSharedAttributes = pick( first( siblings ).attributes, sharedAttributes );
			registry.batch( () => {
				__unstableMarkNextChangeAsNotPersistent();
				updateBlockAttributes( [ clientId ], newSharedAttributes );
			} );
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

			registry.batch( () => {
				if ( ! isEmpty( blocksToUpdate ) && ! isEmpty( newSharedAttributes ) ) {
					updateBlockAttributes( blocksToUpdate, newSharedAttributes );
				}

				setAttributes( newAttributes );
			} );
		},
		[
			attributes,
			clientId,
			getSiblings,
			registry,
			setAttributes,
			sharedAttributes,
			updateBlockAttributes,
		]
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
