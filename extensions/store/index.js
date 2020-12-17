/**
 * External dependencies
 */
// import { castArray } from 'lodash';

/**
 * External dependencies
 */
// import { use, select, subscribe } from '@wordpress/data';

/**
 * Internal dependencies
 */
import './media-player';

// const PLAYER_BLOCK_NAMES = [
// 	'jetpack/podcast-player'
// ];

// /**
//  * Ensure you are working with block object. This either returns the object
//  * or tries to lookup the block by id.
//  *
//  * @param {string|object} block Block object or string identifier.
//  * @returns {object} block object or an empty object if not found.
//  */
// const ensureBlockObject = ( block ) => {
// 	if ( typeof block === 'object' ) {
// 		return block;
// 	}
// 	return select( 'core/block-editor' ).getBlock( block ) || {};
// };

// /**
//  * This helper function walk the given blocks recursively,
//  * to trigger the state tree actions.
//  *
//  * @param {Array}    blocks -            Block instances object or an array of such objects
//  * @param {string}   blockEvent -        Event name used to track.
//  * @param {Function} propertiesHandler - Callback function to populate event properties
//  * @param {object}   parentBlock -       parent block. optional.
//  * @returns {void}
//  */
// function registerMediaAction( blocks, blockEvent, propertiesHandler = () => {}, parentBlock ) {
// 	const castBlocks = castArray( blocks );
// 	if ( ! castBlocks || ! castBlocks.length ) {
// 		return;
// 	}

// 	castBlocks.forEach( ( block ) => {
// 		// Make this compatible with actions that pass only block id, not objects.
// 		block = ensureBlockObject( block );

// 		const eventProperties = propertiesHandler( block, parentBlock );

// 		if (
// 			eventProperties?.name &&
// 			PLAYER_BLOCK_NAMES.indexOf( eventProperties.name ) >= 0
// 		) {
// 			const blockAttributes = select( 'core/block-editor' ).getBlockAttributes( eventProperties.clientId );
// 			console.log( 'blockAttributes: ', blockAttributes );

// 			console.error( 'blockEvent: ', blockEvent );
// 			console.error( 'eventProperties: ', eventProperties );
// 		}

// 		if ( block.innerBlocks && block.innerBlocks.length ) {
// 			registerMediaAction( block.innerBlocks, blockEvent, propertiesHandler, block );
// 		}
// 	} );
// }

// const regiterMediaPlayer = ( blocks ) => {
// 	registerMediaAction( blocks, 'onBlockInsert', ( { name, clientId } ) => ( {
// 		name,
// 		clientId,
// 	} ) );
// };

// const removeMediaPlayer = ( blocks ) => {
// 	registerMediaAction( blocks, 'onBlockRemove', ( { name, clientId } ) => ( {
// 		name,
// 		clientId,
// 	} ) );
// };

// const replaceMediaPlayer = ( blocks ) => {
// 	registerMediaAction( blocks, 'onBlockReplace', ( { name, clientId } ) => ( {
// 		name,
// 		clientId,
// 	} ) );
// };

// const REDUX_TRACKING = {
// 	'core/block-editor': {
// 		insertBlock: regiterMediaPlayer,
// 		insertBlocks: regiterMediaPlayer,
// 		removeBlock: removeMediaPlayer,
// 		removeBlocks: removeMediaPlayer,
// 		replaceBlock: replaceMediaPlayer,
// 		replaceBlocks: replaceMediaPlayer,
// 	},
// };

// use( ( registry ) => ( {
// 	dispatch: ( namespace ) => {
// 		const actions = { ...registry.dispatch( namespace ) };
// 		const storeNamespace = typeof namespace === 'string'
// 			? namespace
// 			: namespace?.name;

// 		const trackers = REDUX_TRACKING[ storeNamespace ];

// 		if ( trackers ) {
// 			Object.keys( trackers ).forEach( ( actionName ) => {
// 				const originalAction = actions[ actionName ];
// 				const tracker = trackers[ actionName ];
// 				actions[ actionName ] = ( ...args ) => {
// 					tracker( ...args );
// 					return originalAction( ...args );
// 				};
// 			} );
// 		}
// 		return actions;
// 	},
// } ) );

// const unsubscribe = subscribe( ( ...args ) => {
// 	console.log( 'args: ', args );
//     // You could use this opportunity to test whether the derived result of a
//     // selector has subsequently changed as the result of a state update.
// } );

// Later, if necessary...
// unsubscribe();