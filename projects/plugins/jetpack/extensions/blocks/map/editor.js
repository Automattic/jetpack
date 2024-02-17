import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import deprecatedV1 from './deprecated/v1';
import deprecatedV2 from './deprecated/v2';
import edit from './edit';
import save from './save';
import styles from './styles';

import './style.scss';
import './editor.scss';

registerJetpackBlockFromMetadata( metadata, {
	edit,
	save,
	styles,
	deprecated: [ deprecatedV2, deprecatedV1 ],
} );
