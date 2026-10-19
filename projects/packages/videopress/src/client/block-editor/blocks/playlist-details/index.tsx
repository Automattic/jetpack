/**
 * Internal dependencies
 */
// Overrides Webpack's publicPath before any lazy chunk loads on wpcom.
import '../../set-webpack-public-path';
import registerChannelBlock from '../../channel/register';
import metadata from './block.json';
import Edit from './edit';

registerChannelBlock( metadata, Edit );
