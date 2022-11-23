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
	<Path
		fillRule="evenodd"
		clipRule="evenodd"
		d="M4 4H12V5.5H4V4ZM18.5 8V9H5.5V8H18.5ZM4 10.5H20V6.5H4V10.5ZM18.5 17.5V18.5H5.5V17.5H18.5ZM20 20V16H4V20H20ZM12 13.5H4V15H12V13.5Z"
		fill={ getIconColor() }
	/>
);

export const settings = {
	title: __( 'Form', 'jetpack' ),
	description: __( 'A simple way to get feedback from folks visiting your site.', 'jetpack' ),
	icon,
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
		align: [ 'wide', 'full' ],
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
	category: 'contact-form',
	transforms,
	deprecated,
};
