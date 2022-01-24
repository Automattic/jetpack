/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { InnerBlocks } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { DonationsIcon } from '../../../shared/icons';
import { DEFAULT_TAB } from './constants';

export const getChildViewSettings = ( title, description, edit, save ) => ( {
	title,
	description,
	DonationsIcon,
	category: 'earn',
	attributes: {
		activeTab: {
			type: 'string',
			default: DEFAULT_TAB,
		},
	},
	edit,
	save,
	supports: {
		inserter: false,
		html: false,
	},
} );

export const getChildViewTemplate = heading => (
	<InnerBlocks
		templateLock={ true }
		template={ [
			[
				'core/heading',
				{
					content: heading,
					level: 3,
				},
			],
			[
				'core/paragraph',
				{
					content: __( 'Choose an amount', 'jetpack' ),
				},
			],
			[
				'core/buttons',
				{},
				[
					[
						'core/button',
						{
							element: 'a',
							text: __( '$5.00', 'jetpack' ),
							className: 'is-style-outline',
						},
					],
					[
						'core/button',
						{
							element: 'a',
							text: __( '$15.00', 'jetpack' ),
							className: 'is-style-outline',
						},
					],
					[
						'core/button',
						{
							element: 'a',
							text: __( '$100.00', 'jetpack' ),
							className: 'is-style-outline',
						},
					],
				],
			],
			[
				'core/paragraph',
				{
					content: __( 'Or enter a custom amount', 'jetpack' ),
					className: 'my_custom_class',
				},
			],
			[
				'core/buttons',
				{},
				[
					[
						'core/button',
						{
							element: 'a',
							placeholder: __( '$50.00', 'jetpack' ),
							className: 'is-style-outline',
						},
					],
				],
			],
			[
				'core/separator',
				{
					className: 'is-style-wide',
				},
			],
			[
				'core/paragraph',
				{
					content: __( 'Your contribution is appreciated.', 'jetpack' ),
				},
			],
			[
				'core/buttons',
				{},
				[
					[
						'core/button',
						{
							element: 'a',
							text: __( 'Donate', 'jetpack' ),
						},
					],
				],
			],
			/*['jetpack/donations-amount', {
				value: '$10',
				currency: 'USD',
				className: 'my_class'
			}],*/
		] }
	/>
);
