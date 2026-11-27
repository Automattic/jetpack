import { __, sprintf } from '@wordpress/i18n';
import { Spinner } from '@wordpress/ui';
import moment from 'moment';
import { getLocaleSlug, capitalize } from '../../../compat/utils';
import { DetailedPayment } from '../../../data/promote-post/use-promote-post-payment-details-query';
import { Payment } from '../../../data/promote-post/use-promote-post-payments-query';
import { paymentStatus } from '../../utils';
import { WPCOMPrintLogo } from './WPComPrintLogo';

interface ReceiptTemplateProps {
	payment: Payment | DetailedPayment;
	billingDetails: string;
	isPrintView?: boolean;
	isLoading?: boolean;
	onBillingDetailsChange?: ( value: string ) => void;
	sites: Record< number, any >; // Sites data must be passed in directly
}

type CampaignType = {
	campaign_id: number;
	name: string;
	impressions: number;
	total: number;
	site_id: number;
	subtotal?: number; // Make subtotal optional to work with both types
};

/**
 * The receipt template is shown in the user's view and the print dialogue.
 * When isPrintView is true, it renders a simplified version suitable for printing
 * For example, without the help text and editable text area, which changes to a static output.
 * @param root0
 * @param root0.payment
 * @param root0.billingDetails
 * @param root0.isPrintView
 * @param root0.isLoading
 * @param root0.onBillingDetailsChange
 * @param root0.sites
 */
export const Receipt = ( {
	payment,
	billingDetails,
	isPrintView = false,
	isLoading = false,
	onBillingDetailsChange,
	sites,
}: ReceiptTemplateProps ) => {
	const localeSlug = getLocaleSlug() || 'en_US';
	const paymentDate = moment( payment.date ).locale( localeSlug ).format( 'LL' );

	// Group campaigns by domain
	const campaignsByDomain: Record< string, CampaignType[] > = {};

	if ( Array.isArray( payment.campaigns ) ) {
		payment.campaigns.forEach( campaign => {
			const site = sites[ campaign.site_id ];
			const domain = site?.domain || 'Unknown Domain';

			if ( ! campaignsByDomain[ domain ] ) {
				campaignsByDomain[ domain ] = [];
			}
			// Cast the campaign to the unified type
			campaignsByDomain[ domain ].push( campaign as CampaignType );
		} );
	}

	return (
		<>
			{ /* Header */ }
			<div className="payment-receipt__header">
				<div className="payment-receipt__organization-logo">
					{ /* Inline logo because we need to insert it in the iframe for printing. Relative paths won't work since the iframe's document may have a different base URL or origin, causing relative asset paths to break. */ }
					<WPCOMPrintLogo />
				</div>
				<div className="payment-receipt__organization-details">
					<div className="payment-receipt__organization-name">
						{ __( 'WordPress.com', 'jetpack-blaze' ) }
					</div>
					<div className="payment-receipt__secondary-text">
						{ __( 'by Automattic, Inc', 'jetpack-blaze' ) }
						<br />
						{ __( '60 29th St. #343, San Francisco, CA 94110', 'jetpack-blaze' ) }
					</div>
				</div>
				<div className="payment-receipt__date payment-receipt__value">{ paymentDate }</div>
			</div>

			{ /* Receipt Info */ }
			<div className="payment-receipt__section">
				<div className="payment-receipt__row payment-receipt__date-mobile">
					<div className="payment-receipt__label">{ __( 'Date', 'jetpack-blaze' ) }</div>
					<div className="payment-receipt__value">{ paymentDate }</div>
				</div>
				<div className="payment-receipt__row">
					<div className="payment-receipt__label">{ __( 'Payment ID', 'jetpack-blaze' ) }</div>
					<div className="payment-receipt__value">{ payment.id }</div>
				</div>
				<div className="payment-receipt__row">
					<div className="payment-receipt__label">{ __( 'Status', 'jetpack-blaze' ) }</div>
					<div className="payment-receipt__value">{ capitalize( payment.status ) }</div>
				</div>
				<div className="payment-receipt__billing-details">
					<div className="payment-receipt__label">{ __( 'Billing Details', 'jetpack-blaze' ) }</div>
					{ ! isPrintView && (
						<div className="payment-receipt__secondary-text">
							{ __(
								'Use this field to add your billing information (eg. business address) before printing.',
								'jetpack-blaze'
							) }
						</div>
					) }
					{ /*Here we either show a text area so the user can enter the details or the static output of the text for the print version.*/ }
					{ isPrintView ? (
						<div className="payment-receipt__value payment-receipt__billing-text">
							{ billingDetails }
						</div>
					) : (
						<textarea
							className="payment-receipt__billing-textarea"
							placeholder={ __(
								'Use this field to add your billing information (e.g. business address) before printing.',
								'jetpack-blaze'
							) }
							value={ billingDetails }
							onChange={ e => onBillingDetailsChange?.( e.target.value ) }
						/>
					) }
				</div>
			</div>

			{ /* Campaign Summary */ }
			<div className="payment-receipt__section">
				<h3 className="payment-receipt__section-title">
					{ __( 'Campaign summary', 'jetpack-blaze' ) }
				</h3>
				{ isLoading && (
					<div className="payment-receipt__inline-loading">
						<Spinner className="payment-receipt__spinner" />
						<div className="payment-receipt__secondary-text">
							{ __( 'Loading campaign details.', 'jetpack-blaze' ) }
						</div>
					</div>
				) }

				{ ! isLoading &&
					( ! Array.isArray( payment.campaigns ) || payment.campaigns.length === 0 ) && (
						<div className="payment-receipt__secondary-text">
							{ __( 'No campaign details available', 'jetpack-blaze' ) }
						</div>
					) }

				{ ! isLoading && Array.isArray( payment.campaigns ) && payment.campaigns.length > 0 && (
					<>
						{ Object.entries( campaignsByDomain ).map( ( [ domain, domainCampaigns = [] ] ) => (
							<div key={ domain } className="payment-receipt__domain-group">
								<div className="payment-receipt__domain-header">
									<h4 className="payment-receipt__domain-name">{ domain }</h4>
								</div>

								{ /* Campaigns for this domain */ }
								{ domainCampaigns.map( campaign => (
									<div
										className="payment-receipt__list-item 'payment-receipt__campaign-item"
										key={ campaign.campaign_id }
									>
										<div className="payment-receipt__item-content">
											<div className="payment-receipt__label payment-receipt__item-with-margin">
												{ campaign.name }
											</div>
											<div className="payment-receipt__value payment-receipt__item-with-margin">
												{ sprintf(
													/* translators: %d is the campaign ID */
													__( 'Campaign ID: %d', 'jetpack-blaze' ),
													campaign.campaign_id
												) }
											</div>
											<div className="payment-receipt__value payment-receipt__item-with-margin">
												{ sprintf(
													/* translators: %s is the number of impressions */
													__( 'Total Impressions: %s', 'jetpack-blaze' ),
													campaign.impressions.toLocaleString()
												) }
											</div>
										</div>
										<div className="payment-receipt__value-bold">
											${ campaign.total.toFixed( 2 ) }
										</div>
									</div>
								) ) }
							</div>
						) ) }
					</>
				) }
			</div>

			{ /* Payment Summary */ }
			<div className="payment-receipt__section">
				<h3 className="payment-receipt__section-title">
					{ __( 'Payment summary', 'jetpack-blaze' ) }
				</h3>

				<div className="payment-receipt__payment-details">
					{ payment.payment_method && (
						<div className="payment-receipt__row payment-receipt__payment-method">
							<div className="payment-receipt__label">
								{ __( 'Payment method:', 'jetpack-blaze' ) }
							</div>
							<div className="payment-receipt__value">{ capitalize( payment.payment_method ) }</div>
						</div>
					) }

					<div className="payment-receipt__payment-amounts">
						{ payment.credits_used > 0 && (
							<>
								<div className="payment-receipt__row">
									<div className="payment-receipt__label">
										{ __( 'Subtotal:', 'jetpack-blaze' ) }
									</div>
									<div className="payment-receipt__value">
										$
										{ payment.total_with_credits
											? payment.total_with_credits.toFixed( 2 )
											: '0.00' }
									</div>
								</div>

								<div className="payment-receipt__row">
									<div className="payment-receipt__label">
										{ __( 'Credits:', 'jetpack-blaze' ) }
									</div>
									<div className="payment-receipt__value">
										-${ payment.credits_used.toFixed( 2 ) }
									</div>
								</div>
							</>
						) }

						<div className="payment-receipt__row">
							<div className="payment-receipt__label">{ __( 'Total:', 'jetpack-blaze' ) }</div>
							<div className="payment-receipt__value payment-receipt__value-bold">
								{ payment.status === paymentStatus.REFUNDED ? (
									<>
										<span style={ { textDecoration: 'line-through' } }>
											${ payment.total_paid.toFixed( 2 ) }
										</span>{ ' ' }
										<span>$0.00</span>
									</>
								) : (
									`$${ payment.total_paid.toFixed( 2 ) }`
								) }
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
};
