import registerJetpackBlock from '../../shared/register-jetpack-block';
import { name, settings } from '.';
import './style.scss';

registerJetpackBlock( name, settings );

// function addTagsOnBlockInsert() {
// 	const { getBlocks: getBlockList } = wp.data.select( 'core/editor' );

// 	// Get current blocks client ids
// 	let blockList = getBlockList().map( block => block.clientId );

// 	wp.data.subscribe( () => {
// 		// Get new blocks client ids
// 		const newBlockList = getBlockList().map( block => block.clientId );
// 		console.log( getBlockList() );

// 		// Compare lengths
// 		const blockListChanged = newBlockList.length !== blockList.length;

// 		if ( ! blockListChanged ) {
// 			return;
// 		}

// 		// Block Added
// 		if ( newBlockList > blockList ) {
// 			// Get added blocks
// 			const added = newBlockList.filter( x => ! blockList.includes( x ) );
// 			console.log( 'added', added );
// 		} else if ( newBlockList < blockList ) {
// 			// Get removed blocks
// 			const removed = blockList.filter( x => ! newBlockList.includes( x ) );
// 			console.log( 'removed', removed );
// 		}

// 		// Update current block list with the new blocks for further comparison
// 		blockList = newBlockList;
// 	} );
// }

// addTagsOnBlockInsert();
