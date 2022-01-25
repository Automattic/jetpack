/**
 * Internal dependencies
 */
import DonationsContext from '../common/context';
import {
	ANNUAL_DONATION_TAB,
	MONTHLY_DONATION_TAB,
	ONE_TIME_DONATION_TAB,
} from '../common/constants';

/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { InnerBlocks } from '@wordpress/block-editor';

const types = {
	[ ONE_TIME_DONATION_TAB ]: {
		heading: __( 'Make a one-time donation', 'jetpack' ),
		cta: __( 'Donate', 'jetpack' ),
	},
	[ MONTHLY_DONATION_TAB ]: {
		heading: __( 'Make a monthly donation', 'jetpack' ),
		cta: __( 'Donate monthly', 'jetpack' ),
	},
	[ ANNUAL_DONATION_TAB ]: {
		heading: __( 'Make a yearly donation', 'jetpack' ),
		cta: __( 'Donate yearly', 'jetpack' ),
	},
};

const Edit = props => {
	const { type } = props.attributes;
	const { heading, cta } = types[ type ];
	const { activeTab } = useContext( DonationsContext );

	return (
		activeTab === type && (
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
									text: cta,
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
		)
	);
};

export default Edit;
