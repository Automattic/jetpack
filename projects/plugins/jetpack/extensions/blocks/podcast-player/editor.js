import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import deprecatedV1 from './deprecated/v1';
import edit from './edit';
import save from './save';

import './style.scss';
import './editor.scss';

registerJetpackBlockFromMetadata( metadata, {
	edit,
	save,
	deprecated: [ deprecatedV1 ],
} );
