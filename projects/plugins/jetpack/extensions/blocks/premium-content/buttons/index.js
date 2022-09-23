import { InnerBlocks } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { button as icon } from '@wordpress/icons';
import edit from './edit';
import save from './save';

const name = 'premium-content/buttons';
const settings = {
	apiVersion: 2,
	title: __( 'Premium Content buttons', 'jetpack' ),
	description: __(
		'Prompt Premium Content visitors to take action with a group of button-style links.',
		'jetpack'
	),
	category: 'grow',
	icon,
	supports: {
		align: true,
		alignWide: false,
		lightBlockWrapper: true,
		inserter: false,
	},
	keywords: [ __( 'link', 'jetpack' ) ],
	edit,
	save,
	usesContext: [ 'premium-content/planId', 'premium-content/isPreview' ],
	deprecated: [
		{
			attributes: {},
			supports: {
				align: true,
				alignWide: false,
				lightBlockWrapper: true,
				inserter: false,
			},
			save() {
				return (
					<div className="wp-block-buttons">
						<InnerBlocks.Content />
					</div>
				);
			},
		},
	],
};

export { name, settings };
