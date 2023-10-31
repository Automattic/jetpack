import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import edit from './components/edit';
import save from './components/save';
import v1 from './deprecated/v1/attributes';

import './editor.scss';

registerJetpackBlockFromMetadata( metadata, {
	edit,
	save,
	deprecated: [ v1 ],
} );
