/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';
import { __, sprintf } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';
import formatCurrency from '@automattic/format-currency';

/**
 * Internal dependencies
 */
import { ANNUAL_DONATION, MONTHLY_DONATION, ONE_TIME_DONATION } from '../../common/constants';
import { minimumTransactionAmountForCurrency } from '../../../../shared/currencies';

const mapAttributes = oldAttributes => ( {
	[ ONE_TIME_DONATION ]: oldAttributes[ ONE_TIME_DONATION ].show,
	[ MONTHLY_DONATION ]: oldAttributes[ MONTHLY_DONATION ].show,
	[ ANNUAL_DONATION ]: oldAttributes[ ANNUAL_DONATION ].show,
	showCustomAmount: oldAttributes.showCustomAmount,
	currency: oldAttributes.currency,
	fallbackLinkUrl: oldAttributes.fallbackLinkUrl,
	style: {
		border: {
			width: '1px',
		},
	},
	borderColor: 'foreground',
} );

const createDonationView = (
	donationType,
	donation,
	chooseAmountText,
	customAmountText,
	currency
) =>
	createBlock(
		'jetpack/donations-view',
		{
			type: donationType,
		},
		[
			createBlock( 'core/heading', {
				content: donation.heading || __( 'Make a one-time donation', 'jetpack' ),
				level: 3,
			} ),
			createBlock( 'core/paragraph', {
				content: chooseAmountText || __( 'Choose an amount', 'jetpack' ),
			} ),
			createBlock(
				'core/buttons',
				{
					className: 'donations__amounts',
				},
				donation.amounts.map( ( amount, index ) =>
					createBlock( 'jetpack/donations-amount', {
						label: sprintf(
							// translators: %d: Tier level e.g: "1", "2", "3"
							__( 'Tier %d', 'jetpack' ),
							index + 1
						),
						amount: Number( amount ),
						currency,
						baseAmountMultiplier: amount / minimumTransactionAmountForCurrency( currency ),
					} )
				)
			),
			createBlock( 'jetpack/donations-custom-amount', {}, [
				createBlock( 'core/paragraph', {
					content: customAmountText || __( 'Custom amount', 'jetpack' ),
				} ),
				createBlock(
					'core/group',
					{
						layout: {
							type: 'flex',
							allowOrientation: false,
						},
					},
					[
						createBlock( 'jetpack/donations-amount', {
							label: __( 'Custom amount', 'jetpack' ),
							baseAmountMultiplier: 100,
							currency,
							amount: formatCurrency(
								minimumTransactionAmountForCurrency( currency ) * 100,
								currency,
								{ symbol: '' }
							),
							className: 'donations__custom-amount',
							disabled: true,
						} ),
					]
				),
			] ),
			createBlock( 'core/separator', {
				className: 'is-style-wide',
			} ),
			createBlock( 'core/paragraph', {
				content: donation.extraText || __( 'Your contribution is appreciated.', 'jetpack' ),
			} ),
			createBlock( 'core/buttons', {}, [
				createBlock( 'core/button', {
					element: 'a',
					text: donation.buttonText || __( 'Donate', 'jetpack' ),
					className: 'donations__donate-button',
				} ),
			] ),
		]
	);

export default {
	attributes: {
		currency: {
			type: 'string',
			default: 'USD',
		},
		oneTimeDonation: {
			type: 'object',
			default: {
				show: true,
				planId: null,
				amounts: [ 5, 15, 100 ],
				heading: __( 'Make a one-time donation', 'jetpack' ),
				extraText: __( 'Your contribution is appreciated.', 'jetpack' ),
				buttonText: __( 'Donate', 'jetpack' ),
			},
		},
		monthlyDonation: {
			type: 'object',
			default: {
				show: true,
				planId: null,
				amounts: [ 5, 15, 100 ],
				heading: __( 'Make a monthly donation', 'jetpack' ),
				extraText: __( 'Your contribution is appreciated.', 'jetpack' ),
				buttonText: __( 'Donate monthly', 'jetpack' ),
			},
		},
		annualDonation: {
			type: 'object',
			default: {
				show: true,
				planId: null,
				amounts: [ 5, 15, 100 ],
				heading: __( 'Make a yearly donation', 'jetpack' ),
				extraText: __( 'Your contribution is appreciated.', 'jetpack' ),
				buttonText: __( 'Donate yearly', 'jetpack' ),
			},
		},
		showCustomAmount: {
			type: 'boolean',
			default: true,
		},
		chooseAmountText: {
			type: 'string',
			default: __( 'Choose an amount', 'jetpack' ),
		},
		customAmountText: {
			type: 'string',
			default: __( 'Or enter a custom amount', 'jetpack' ),
		},
		fallbackLinkUrl: {
			type: 'string',
			default: '',
		},
	},
	supports: {
		html: false,
	},
	save: ( { attributes } ) => {
		const { fallbackLinkUrl, oneTimeDonation, monthlyDonation, annualDonation } = attributes;

		if (
			! oneTimeDonation ||
			! oneTimeDonation.show ||
			! oneTimeDonation.planId ||
			oneTimeDonation.planId === -1
		) {
			return null;
		}

		return (
			<div>
				<RichText.Content tagName="h4" value={ oneTimeDonation.heading } />
				<RichText.Content tagName="p" value={ oneTimeDonation.extraText } />
				<RichText.Content
					tagName="a"
					className="jetpack-donations-fallback-link"
					href={ fallbackLinkUrl }
					rel="noopener noreferrer noamphtml"
					target="_blank"
					value={ oneTimeDonation.buttonText }
				/>
				{ monthlyDonation.show && (
					<>
						<hr className="donations__separator" />
						<RichText.Content tagName="h4" value={ monthlyDonation.heading } />
						<RichText.Content tagName="p" value={ monthlyDonation.extraText } />
						<RichText.Content
							tagName="a"
							className="jetpack-donations-fallback-link"
							href={ fallbackLinkUrl }
							rel="noopener noreferrer noamphtml"
							target="_blank"
							value={ monthlyDonation.buttonText }
						/>
					</>
				) }
				{ annualDonation.show && (
					<>
						<hr className="donations__separator" />
						<RichText.Content tagName="h4" value={ annualDonation.heading } />
						<RichText.Content tagName="p" value={ annualDonation.extraText } />
						<RichText.Content
							tagName="a"
							className="jetpack-donations-fallback-link"
							href={ fallbackLinkUrl }
							rel="noopener noreferrer noamphtml"
							target="_blank"
							value={ annualDonation.buttonText }
						/>
					</>
				) }
			</div>
		);
	},
	migrate: attributes => {
		const mappedAttributes = mapAttributes( attributes );
		const {
			oneTimeDonation,
			monthlyDonation,
			annualDonation,
			chooseAmountText,
			customAmountText,
			currency,
		} = attributes;

		const innerBlocks = [
			createDonationView(
				ONE_TIME_DONATION,
				oneTimeDonation,
				chooseAmountText,
				customAmountText,
				currency
			),
			createDonationView(
				MONTHLY_DONATION,
				monthlyDonation,
				chooseAmountText,
				customAmountText,
				currency
			),
			createDonationView(
				ANNUAL_DONATION,
				annualDonation,
				chooseAmountText,
				customAmountText,
				currency
			),
		];

		return [ mappedAttributes, innerBlocks ];
	},
};
