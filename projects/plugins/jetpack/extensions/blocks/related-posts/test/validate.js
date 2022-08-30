import { name, settings } from '../';
import runBlockFixtureTests from '../../../shared/test/block-fixtures';

/**
 * 👀 Update this array of blocks to contain the name and settings for all blocks
 * involved in this set of tests.
 *
 * Example containing multiple blocks:
 * ```
 * const blocks = [
 *    { name: 'jetpack/whatsapp-button', settings },
 *    { name: 'jetpack/send-a-message', settings: parentSettings },
 * ];
 * ```
 */
const blocks = [ { name: `jetpack/${ name }`, settings } ];
runBlockFixtureTests( `jetpack/${ name }`, blocks, __dirname );
