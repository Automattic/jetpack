import { registerBlockVariation } from '@wordpress/blocks';
import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import deprecatedV1 from './deprecated/v1';
import edit from './edit';
import save from './save';
import tipsVariation from './tips-variation';

import './editor.scss';

registerJetpackBlockFromMetadata( metadata, {
	edit,
	save,
	deprecated: [ deprecatedV1 ],
} );

registerBlockVariation( 'jetpack/donations', tipsVariation );
