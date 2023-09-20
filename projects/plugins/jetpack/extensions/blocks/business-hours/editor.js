import { __, _x } from '@wordpress/i18n';
import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import BusinessHours from './edit';

import './editor.scss';
import './style.scss';

registerJetpackBlockFromMetadata( metadata, {
	title: __( 'Business Hours', 'jetpack' ),
	description: __( 'Display opening hours for your business.', 'jetpack' ),
	keywords: [
		_x( 'opening hours', 'block search term', 'jetpack' ),
		_x( 'closing time', 'block search term', 'jetpack' ),
		_x( 'schedule', 'block search term', 'jetpack' ),
		_x( 'working day', 'block search term', 'jetpack' ),
	],
	edit: props => <BusinessHours { ...props } />,
	save: () => null,
} );
