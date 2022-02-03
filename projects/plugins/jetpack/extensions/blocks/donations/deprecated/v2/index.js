/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';
import { ANNUAL_DONATION, MONTHLY_DONATION, ONE_TIME_DONATION } from '../../common/constants';

const mapAttributes = oldAttributes => ( {
	[ ONE_TIME_DONATION ]: oldAttributes[ ONE_TIME_DONATION ].show,
	[ MONTHLY_DONATION ]: oldAttributes[ MONTHLY_DONATION ].show,
	[ ANNUAL_DONATION ]: oldAttributes[ ANNUAL_DONATION ].show,
	showCustomAmount: oldAttributes.showCustomAmount,
	currency: oldAttributes.currency,
	fallbackLinkUrl: oldAttributes.fallbackLinkUrl,
} );

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

		const innerBlocks = [
			createBlock( 'core/paragraph', {
				content: 'My migrated text',
			} ),
		];

		return [ mappedAttributes, innerBlocks ];
	},
};
