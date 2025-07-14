import { registerJetpackBlockFromMetadata } from '../block/register-jetpack-block';
import metadata from './block.json';
import edit from './edit';
import PayPalIcon from './icon';
import './editor.scss';

registerJetpackBlockFromMetadata( metadata, {
	edit,
	save: () => null,
	icon: PayPalIcon,
} );
