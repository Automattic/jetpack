import { Path } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import renderMaterialIcon from '../../../shared/render-material-icon';
import edit from './edit';
import save from './save';

const attributes = {
	email: {
		type: 'string',
		default: '',
	},
};

export const name = 'email';

export const settings = {
	title: __( 'Email Address', 'jetpack' ),
	description: __(
		'Lets you add an email address with an automatically generated click-to-email link.',
		'jetpack'
	),
	keywords: [
		'e-mail', // not translatable on purpose
		'email', // not translatable on purpose
		_x( 'message', 'block search term', 'jetpack' ),
	],
	icon: renderMaterialIcon(
		<Path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z" />
	),
	category: 'grow',
	attributes,
	edit,
	save,
	parent: [ 'jetpack/contact-info' ],
};
