import logger from '../logger.js';

/**
 * Wait for a block to be available.
 *
 * Reloads the page up to 20 times, waiting 1s between reloads, before giving up.
 * Returns even if unsuccessful.
 *
 * @param {string} blockSlug - Block slug substring to search for.
 * @param {page} page - Playwright page instance.
 */
export async function waitForBlock( blockSlug, page ) {
	let block = await findAvailableBlock( blockSlug, page );
	if ( block ) {
		return;
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

/**
 * Find available block slug by substring.
 *
 * @param {string} blockSlug - Block slug substring to search for.
 * @param {page} page - Playwright page instance.
 * @returns {string|undefined} Found slug.
 */
async function findAvailableBlock( blockSlug, page ) {
	const allBlocks = await getAllAvailableBlocks( page );
	return allBlocks.find( b => b.includes( blockSlug ) );
}

/**
 * Get all available blocks
 *
 * @param {page} page - Playwright page instance.
 * @returns {string[]} Block slugs.
 */
async function getAllAvailableBlocks( page ) {
	return await page.page.evaluate( () =>
		wp.data
			.select( 'core/blocks' )
			.getBlockTypes()
			.map( b => b.name )
	);
}
