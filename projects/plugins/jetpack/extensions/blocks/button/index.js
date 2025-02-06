import { __ } from '@wordpress/i18n';
import getCategoryWithFallbacks from '../../shared/get-category-with-fallbacks';
import attributes from './attributes';
import edit from './edit';
import icon from './icon';
import save from './save';

export const name = 'button';

export const settings = {
	apiVersion: 3,
	title: __( 'Button', 'jetpack' ),
	icon,
	category: getCategoryWithFallbacks( 'design', 'layout' ),
	keywords: [],
	supports: {
		html: false,
		inserter: false,
		align: [ 'left', 'center', 'right' ],
		typography: {
			fontSize: true,
			__experimentalFontFamily: true,
			__experimentalTextTransform: true,
			__experimentalDefaultControls: {
				fontSize: true,
			},
		},
	},
	styles: [
		{ name: 'fill', label: __( 'Fill', 'jetpack' ), isDefault: true },
		{ name: 'outline', label: __( 'Outline', 'jetpack' ) },
	],
	attributes,
	edit,
	save,
	usesContext: [ 'jetpack/parentBlockWidth' ],
};
