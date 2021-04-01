/**
 * Internal dependencies
 */
import { name, settings } from '../';
import runBlockFixtureTests from '../../../shared/test/block-fixtures';

/**
 * 👀 Update this array of blocks to contain the name and settings for **ALL**
 * blocks involved, used, or rendered in this set of tests.
 *
 * This includes any blocks used as:
 *   - inner child blocks ( `InnerBlocks` )
 *   - a parent block wrapper
 *   - or otherwise contained in the block's saved content
 *
 * Ideally, keep the primary block you are testing as the first block definition
 * in the array.
 *
 * Example of block with a parent block wrapper:
 * const blocks = [
 *		{ name: 'jetpack/whatsapp-button', settings },
 *		{ name: 'jetpack/send-a-message', settings: parentSettings },
 * ];
 *
 * Example of block containing inner button block:
 * const blocks = [
 *		{ name: 'jetpack/calendly', settings },
 *		{ name: 'jetpack/button', settings: buttonSettings },
 * ];
 */
const blocks = [ { name: `jetpack/${ name }`, settings } ];
runBlockFixtureTests( `jetpack/${ name }`, blocks, __dirname );
