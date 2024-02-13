import logger from '../logger.js';

export async function waitForBlock( blockSlug, page ) {
	let block = await findAvailableBlock( blockSlug, page );
	if ( block ) {
		return true;
	}
	let count = 0;
	while ( count < 20 && ! block ) {
		logger.debug( `Waiting for ${ blockSlug } block to be available` );
		// eslint-disable-next-line
		await page.waitForTimeout( 1000 );
		await page.reload( { waitUntil: 'domcontentloaded' } );
		block = await findAvailableBlock( blockSlug, page );
		count += 1;
	}
}

async function findAvailableBlock( blockSlug, page ) {
	const allBlocks = await getAllAvailableBlocks( page );
	return allBlocks.find( b => b.includes( blockSlug ) );
}

async function getAllAvailableBlocks( page ) {
	return await page.page.evaluate( () =>
		wp.data
			.select( 'core/blocks' )
			.getBlockTypes()
			.map( b => b.name )
	);
}
