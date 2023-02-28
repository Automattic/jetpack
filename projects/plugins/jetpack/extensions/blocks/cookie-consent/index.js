import { ExternalLink } from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getIconColor } from '../../shared/block-icons';
import attributes from './attributes';
import edit from './edit';
import icon from './icon';
import save from './save';

/**
 * Style dependencies
 */
import './editor.scss';

export const name = 'cookie-consent';
export const title = __( 'Cookie Consent', 'jetpack' );
export const cookieName = 'eucookielaw';
export const settings = {
	title,
	description: (
		<Fragment>
			<p>
				{ __(
					'To display this block on all pages of your site, please add it inside a Template Part that is present on all your templates, like a Header or a Footer.',
					'jetpack'
				) }
			</p>
			<ExternalLink href="#">
				{ __( 'Learn more about the Cookie Consent block', 'jetpack' ) }
			</ExternalLink>
		</Fragment>
	),
	icon: {
		src: icon,
		foreground: getIconColor(),
	},
	category: 'jetpack',
	keywords: [],
	supports: {
		align: [ 'left', 'right', 'wide', 'full' ],
		alignWide: true,
		anchor: false,
		color: {
			gradients: true,
			link: true,
		},
		spacing: {
			padding: true,
		},
		customClassName: true,
		className: true,
		html: false,
		lock: false,
		multiple: false,
		reusable: false,
	},
	edit,
	save,
	attributes,
	example: {
		attributes: {
			// @TODO: Add default values for block attributes, for generating the block preview.
		},
	},
};
