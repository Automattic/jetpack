import { usePrevious } from '@wordpress/compose';
import { createContext, useContext, useEffect, useMemo, useReducer } from '@wordpress/element';
import { isEqual } from 'lodash';

/** @typedef {import('react')} React */

/**
 * Context for managing synced attributes across blocks.
 *
 * @type {React.Context<?{syncedAttributes: object, setSyncedAttributes: Function}>}
 */
const SyncedAttributeContext = createContext( {} );

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
 * Returns the synced attributes for a block.
 *
 * @param {string} name - The name of the block.
 *
 * @return {Array} Array containing the synced attributes and the function to update them.
 */
function useSyncedAttributesForBlock( name ) {
	const [ syncedAttributes, setSyncedAttributes ] = useContext( SyncedAttributeContext );

	return useMemo( () => {
		return [
			syncedAttributes?.[ name ],
			attributes => setSyncedAttributes( { name, attributes } ),
		];
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
	// The synced attributes are pulled from the parent form block via react context.
	// They can be updated using the `setSyncedAttributes` function.
	// These attributes are the source of truth for all blocks that are synced.
	// If they change, the current block will be updated to match the synced attributes using its `setAttributes` function.
	const [ syncedAttributes, setSyncedAttributes ] = useSyncedAttributesForBlock( name );

	// These attributes for the current block that this hook operates on.
	// If these change and the block is synced, the synced attributes will be updated on the parent form using the `setSyncedAttributes` function.
	const ownAttributes = useMemo(
		() => pickSyncedAttributes( attributes, syncedAttributeKeys ),
		[ attributes, syncedAttributeKeys ]
	);
	const previousOwnAttributes = usePrevious( ownAttributes );

	useEffect( () => {
		if ( ! isSynced ) {
			return;
		}

		// Check whether the block's own attributes have changed compared to the block's previous own attributes
		// and the synced attributes.
		//
		// The block's previous own attributes are checked to protect against a situation where the block might have been
		// modified to be different to the synced attributeswhile it's `isSynced` attribute was `false`, then later the
		// `isSynced` was set back to `true`.
		// In this case, we don't want to update the synced attributes, since that would cause every other block to
		// receive the block's own attributes.
		// Instead we want the block that changed back to being synced to update itself to match the synced attributes.
		const updatedOwnAttributes = getModifiedAttributes( ownAttributes, [
			syncedAttributes,
			previousOwnAttributes,
		] );
		// If there are changes to the block's own attributes, update the synced attributes.
		if ( Object.keys( updatedOwnAttributes ).length > 0 ) {
			setSyncedAttributes( updatedOwnAttributes );

			// Return early and don't continue to try syncing the block's own attributes.
			// The local state of the synced attributes has not yet been updated,
			// so the block's own attributes will end up being set back to whatever they previously were
			// if this early return were not present.
			return;
		}

		// Check whether the synced attributes have changed when compared to the block's own attributes.
		const updatedSyncedAttributes = getModifiedAttributes( syncedAttributes, [ ownAttributes ] );
		// If there are changes to the synced attributes, update the block's own attributes.
		if ( Object.keys( updatedSyncedAttributes ).length > 0 ) {
			setOwnAttributes( updatedSyncedAttributes );
		}
	}, [
		isSynced,
		setSyncedAttributes,
		setOwnAttributes,
		ownAttributes,
		previousOwnAttributes,
		syncedAttributes,
	] );
}
