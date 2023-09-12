import { InnerBlocks } from '@wordpress/block-editor';
import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import deprecatedV1 from './deprecated/v1';
import edit from './edit';
import transforms from './transforms';

import './editor.scss';

registerJetpackBlockFromMetadata( metadata, {
	edit,
	save: () => <InnerBlocks.Content />,
	deprecated: [ deprecatedV1 ],
	transforms,
} );
