/**
 * Internal dependencies
 */
import DonationsContext from '../common/context';
import { ANNUAL_DONATION, MONTHLY_DONATION, ONE_TIME_DONATION } from '../common/constants';

/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { InnerBlocks } from '@wordpress/block-editor';

const types = {
	[ ONE_TIME_DONATION ]: {
		heading: __( 'Make a one-time donation', 'jetpack' ),
		cta: __( 'Donate', 'jetpack' ),
	},
	[ MONTHLY_DONATION ]: {
		heading: __( 'Make a monthly donation', 'jetpack' ),
		cta: __( 'Donate monthly', 'jetpack' ),
	},
	[ ANNUAL_DONATION ]: {
		heading: __( 'Make a yearly donation', 'jetpack' ),
		cta: __( 'Donate yearly', 'jetpack' ),
	},
};

const Edit = props => {
	const { attributes, setAttributes } = props;
	const { type } = attributes;
	const { heading, cta } = types[ type ];
	const { activeTab, fallbackLinkUrl, products } = useContext( DonationsContext );
	const planId = products[ type ];

	setAttributes( { fallbackLinkUrl, planId } );

	return (
		<div className={ classNames( 'donations__view', { 'is-active': activeTab === type } ) }>
			<InnerBlocks
				templateLock={ 'all' }
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
						{ className: 'donations__amounts' },
						[ 10, 30, 200 ].map( ( multiplier, index ) => [
							'jetpack/donations-amount',
							{
								label: sprintf(
									// translators: %d: Tier level e.g: "1", "2", "3"
									__( 'Tier %d', 'jetpack' ),
									index + 1
								),
								baseAmountMultiplier: multiplier,
							},
						] ),
					],
					[ 'jetpack/donations-custom-amount', {} ],
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
									className: 'donations__donate-button',
								},
							],
						],
					],
				] }
			/>
		</div>
	);
};

export default Edit;
