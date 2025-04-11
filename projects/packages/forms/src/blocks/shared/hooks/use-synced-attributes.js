import { usePrevious } from '@wordpress/compose';
import { useDispatch } from '@wordpress/data';
import { createContext, useContext, useEffect, useMemo, useReducer } from '@wordpress/element';
import { isEqual } from 'lodash';
/** @typedef {import('react')} React */

/**
 * Context for managing synced attributes across blocks.
 *
 * @type {React.Context<[syncedAttributes: object, setSyncedAttributes: Function]>}
 */
const SyncedAttributeContext = createContext( [ {}, () => {} ] );

/**
 * Provider component that manages synced attributes across blocks.
 *
 * @param {object} props          - Component props.
 * @param {object} props.children - Child components to render within the provider.
 * @return {JSX.Element}          The provider component.
 */
export function SyncedAttributeProvider( { children } ) {
	const value = useReducer( ( state, action ) => {
		const { name, attributes } = action;
		return {
			...state,
			[ name ]: {
				...( state[ name ] ?? {} ),
				...attributes,
			},
		};
	}, {} );

	return (
		<SyncedAttributeContext.Provider value={ value }>{ children }</SyncedAttributeContext.Provider>
	);
}

/**
 * Uses the `SyncedAttributeContext`, but returns only the values for the given block type.
 * The `setSyncedAttributes` function it returns is also adjusted so that it only updates
 * the attributes for the given block type.
 *
 * @param {string}             name         - The name of the block.
 * @param {[object, Function]} contextValue - The context value from SyncedAttributeContext.
 * @return {Array} Array containing the synced attributes and the function to update them.
 */
function useSyncedAttributesForBlock( name, contextValue ) {
	const [ syncedAttributes, setSyncedAttributes ] = contextValue;

	return useMemo( () => {
		return [ syncedAttributes[ name ], attributes => setSyncedAttributes( { name, attributes } ) ];
	}, [ name, setSyncedAttributes, syncedAttributes ] );
}

/**
 * Returns an object containing only the attributes that are in the syncedAttributeKeys array.
 *
 * @param {object}   attributes          - The attributes of the block.
 * @param {string[]} syncedAttributeKeys - The keys of the attributes that are synced.
 *
 * @return {object} Object containing only the synced attributes.
 */
function pickSyncedAttributes( attributes, syncedAttributeKeys ) {
	return syncedAttributeKeys.reduce( ( acc, key ) => {
		acc[ key ] = attributes[ key ];
		return acc;
	}, {} );
}

/**
 * Returns an object containing only the attributes that have different values compared to the attribute sets.
 *
 * When multiple attribute sets are provided, the function performs an AND check, so for a given key,
 * the value in EVERY attribute set must be different for it to be considered modified.
 *
 * @param {object}   sourceAttributes - The source attributes to compare against.
 * @param {Object[]} attributeSets    - Array of attribute sets to compare with the source.
 *
 * @return {object} Object containing only the modified attributes.
 */
function getModifiedAttributes( sourceAttributes, attributeSets ) {
	if ( ! sourceAttributes ) {
		return {};
	}

	return Object.keys( sourceAttributes ).reduce( ( acc, key ) => {
		// Use lodash `isEqual` to perform a deep comparison of the attributes.
		// With `!==` this would return a lot of false positives where different blocks
		// have objects with different references, but the same inner attribute values.
		// TODO - replace this with not lodash.
		if ( attributeSets.every( set => ! isEqual( sourceAttributes[ key ], set?.[ key ] ) ) ) {
			acc[ key ] = sourceAttributes[ key ];
		}

		return acc;
	}, {} );
}

/**
 * This hook is used to sync a subset of attributes of a block with the other blocks of the same type within a form.
 * The syncing only happens if the block has the `shareFieldAttributes` attribute set to `true`.
 *
 * @param {string}   name                - The name of the block.
 * @param {boolean}  isSynced            - Whether the block is synced.
 * @param {string[]} syncedAttributeKeys - The keys of the attributes that are synced.
 * @param {object}   attributes          - The attributes of the block.
 * @param {Function} setOwnAttributes    - The block's own `setAttributes` function, renamed for some clarity.
 */
export function useSyncedAttributes(
	name,
	isSynced,
	syncedAttributeKeys,
	attributes,
	setOwnAttributes
) {
	const { __unstableMarkNextChangeAsNotPersistent } = useDispatch( 'core/block-editor' );
	const contextValue = useContext( SyncedAttributeContext );

	// The synced attributes are pulled from the parent form block via react context.
	// They can be updated using the `setSyncedAttributes` function.
	// These attributes are the source of truth for all blocks that are synced.
	// If they change, the current block will be updated to match the synced attributes using its `setAttributes` function.
	const [ syncedAttributes, setSyncedAttributes ] = useSyncedAttributesForBlock(
		name,
		contextValue
	);

	// The own attributes belong to the current block that this hook operates on.
	// If these change and the block is synced, the synced attributes will be updated on the parent form using
	// the `setSyncedAttributes` function.
	const ownAttributes = useMemo(
		() => pickSyncedAttributes( attributes, syncedAttributeKeys ),
		[ attributes, syncedAttributeKeys ]
	);
	const previousOwnAttributes = usePrevious( ownAttributes ) ?? ownAttributes;

	useEffect( () => {
		// Skip syncing if not needed or possible.
		// When a field is rendered in a preview i.e. without a parent form the useFormWrapper hook will
		// wrap the field in a new block leading to a moment when the synced attribute context is not yet available.
		if ( ! isSynced || ! contextValue ) {
			return;
		}

		// If the synced attributes are unset, but the block does have attribute values, it indicates
		// the synced attributes have not yet been primed. Set them to an initial value.
		// The only drawback here it that this will cause a `setSyncedAttributes` call for every block on the
		// first run through.
		if ( ! syncedAttributes && ownAttributes ) {
			setSyncedAttributes( ownAttributes );
			return;
		}

		// Check whether the block's own attributes have changed compared to the block's previous own attributes
		// and the synced attributes.
		//
		// The block's previous own attributes are checked to protect against a situation where a new field block is inserted
		// into the form with different attribute values to the synced attributes.
		// In this case we don't want every other block to sync to this new block, instead we want the new block
		// to sync to the `syncedAttributes`.
		const updatedOwnAttributes = getModifiedAttributes( ownAttributes, [
			syncedAttributes,
			previousOwnAttributes,
		] );
		// If there are changes to the block's own attributes, update the synced attributes.
		if ( Object.keys( updatedOwnAttributes ).length > 0 ) {
			setSyncedAttributes( updatedOwnAttributes );
			return;
		}

		// Check whether the synced attributes have changed when compared to the block's own attributes.
		const updatedSyncedAttributes = getModifiedAttributes( syncedAttributes, [ ownAttributes ] );
		// If there are changes to the synced attributes, update the block's own attributes.
		if ( Object.keys( updatedSyncedAttributes ).length > 0 ) {
			// Mark the change as not persistent to prevent the attribute modifications from being
			// individual updates to the undo stack.
			// It might be good to move towards batching these changes together, to do this the updates,
			// would need to be made from the top level `SyncedAttributeProvider`.
			__unstableMarkNextChangeAsNotPersistent();
			setOwnAttributes( updatedSyncedAttributes );
		}
	}, [
		isSynced,
		setSyncedAttributes,
		setOwnAttributes,
		ownAttributes,
		previousOwnAttributes,
		syncedAttributes,
		__unstableMarkNextChangeAsNotPersistent,
		contextValue,
	] );
}
