import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import BusinessHours from './edit';

import './editor.scss';
import './style.scss';

registerJetpackBlockFromMetadata( metadata, {
	edit: props => <BusinessHours { ...props } />,
	save: () => null,
} );
