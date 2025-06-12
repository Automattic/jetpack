import { registerJetpackBlockFromMetadata } from '../register-jetpack-block';
import metadata from './block.json';
import edit from './edit';
import PayPalIcon from './icon';
import save from './save';
import './editor.scss';

registerJetpackBlockFromMetadata( metadata, {
	edit,
	save,
	icon: PayPalIcon,
} );
