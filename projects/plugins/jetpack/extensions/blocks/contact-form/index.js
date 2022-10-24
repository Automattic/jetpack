import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';
import { Path } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import './editor.scss';
import { getIconColor } from '../../shared/block-icons';
import renderMaterialIcon from '../../shared/render-material-icon';
import defaultAttributes from './attributes';
import deprecated from './deprecated';
import edit from './edit';
import transforms from './transforms';
import variations from './variations';

export const name = 'contact-form';

const icon = renderMaterialIcon(
	<Path d="M13 7.5h5v2h-5zm0 7h5v2h-5zM19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM11 6H6v5h5V6zm-1 4H7V7h3v3zm1 3H6v5h5v-5zm-1 4H7v-3h3v3z" />
);

export const settings = {
	title: __( 'Form', 'jetpack' ),
	description: __( 'A simple way to get feedback from folks visiting your site.', 'jetpack' ),
	icon: {
		src: icon,
		foreground: getIconColor(),
	},
	keywords: [
		_x( 'email', 'block search term', 'jetpack' ),
		_x( 'feedback', 'block search term', 'jetpack' ),
		_x( 'contact form', 'block search term', 'jetpack' ),
	],
	supports: {
		color: {
			link: true,
			gradients: true,
		},
		html: false,
		spacing: {
			padding: true,
			margin: true,
		},
	},
	attributes: defaultAttributes,
	edit,
	save: () => {
		const blockProps = useBlockProps.save();
		return (
			<div { ...blockProps }>
				<InnerBlocks.Content />
			</div>
		);
	},
	variations,
	category: 'grow',
	transforms,
	deprecated,
};
