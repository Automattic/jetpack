import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import edit from './edit';
import { StarIcon } from './icon';
import save from './save';

import './style.scss';
import './editor.scss';

registerJetpackBlockFromMetadata( metadata, {
	edit: edit( StarIcon ),
	save: save( '★' ), // Fallback symbol if the block is removed or the render_callback deactivated.
} );
