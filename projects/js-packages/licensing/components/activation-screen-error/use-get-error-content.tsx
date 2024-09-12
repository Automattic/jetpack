import { getRedirectUrl } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import React from 'react';
import { LICENSE_ERRORS } from './constants';

type LicenseErrorKeysType = keyof typeof LICENSE_ERRORS;
type LicenseErrorValuesType = ( typeof LICENSE_ERRORS )[ LicenseErrorKeysType ];

export const useGetErrorContent = ( licenseError: string, errorType: LicenseErrorValuesType ) => {
	if ( ! licenseError ) {
		return {
			errorMessage: null,
			errorInfo: null,
		};
	}

	const needHelpGetInTouchLink = createInterpolateElement(
		__( 'Need help? <a>Get in touch</a>.', 'jetpack' ),
		{
			a: (
				<ExternalLink
					href={ getRedirectUrl( 'jetpack-support-license-activation' ) }
					rel="noopener noreferrer"
				></ExternalLink>
			),
		}
	);

	switch ( errorType ) {
		case LICENSE_ERRORS.NOT_SAME_OWNER:
			return {
				errorMessage: __(
					'The account that purchased the plan and the account managing this site are different.',
					'jetpack'
				),
				errorInfo: (
					<>
						<p>
							{ createInterpolateElement(
								__( 'Follow these <a>steps</a> to resolve it.', 'jetpack' ),
								{
									a: (
										<ExternalLink
											rel="noopener noreferrer"
											href={ getRedirectUrl( 'jetpack-support-activate-license', {
												anchor: 'different-user',
											} ) }
										></ExternalLink>
									),
								}
							) }
						</p>
						<ol>
							<li>{ __( 'Disconnect Jetpack from your site.', 'jetpack' ) }</li>
							<li>
								{ __( 'Log in to the WordPress.com account that purchased the plan.', 'jetpack' ) }
							</li>
							<li>{ __( 'Reconnect Jetpack.', 'jetpack' ) }</li>
						</ol>
						<p>{ needHelpGetInTouchLink }</p>
					</>
				),
			};
		case LICENSE_ERRORS.ACTIVE_ON_SAME_SITE:
			return {
				errorMessage: __( 'This license is already active on your site.', 'jetpack' ),
				errorInfo: null,
			};
		case LICENSE_ERRORS.ATTACHED_LICENSE:
			return {
				errorMessage: __( 'This license is already active on another website', 'jetpack' ),
				errorInfo: (
					<ul>
						<li>
							{ createInterpolateElement(
								__( 'If you would like to transfer it, please <a>get in touch</a>.', 'jetpack' ),
								{
									a: (
										<ExternalLink
											rel="noopener noreferrer"
											href={ getRedirectUrl( 'jetpack-support-license-activation' ) }
										></ExternalLink>
									),
								}
							) }
						</li>
						<li>
							{ createInterpolateElement(
								__( 'To use Jetpack on both sites, please <a>buy another license</a>.', 'jetpack' ),
								{
									a: (
										<ExternalLink
											rel="noopener noreferrer"
											href={ getRedirectUrl( 'my-jetpack-my-plans-purchase-no-site' ) }
										></ExternalLink>
									),
								}
							) }
						</li>
					</ul>
				),
			};
		case LICENSE_ERRORS.PRODUCT_INCOMPATIBILITY:
			return {
				errorMessage: __(
					'Your site already has an active Jetpack plan of equal or higher value.',
					'jetpack'
				),
				errorInfo: (
					<>
						<p>
							{ __(
								'It looks like your website already has a Jetpack plan that’s equal to or better than the one you’re trying to activate.',
								'jetpack'
							) }
						</p>

						<p>
							{ __(
								'You can either use this license on a different site or cancel your current plan for a refund.',
								'jetpack'
							) }
						</p>
						<p>{ needHelpGetInTouchLink }</p>
					</>
				),
			};
		case LICENSE_ERRORS.REVOKED_LICENSE:
			return {
				errorMessage: __(
					'The subscription is no longer active or has expired. Please purchase a new license.',
					'jetpack'
				),
				errorInfo: <p>{ needHelpGetInTouchLink }</p>,
			};
		case LICENSE_ERRORS.INVALID_INPUT:
			return {
				errorMessage: __( 'Unable to validate this license key.', 'jetpack' ),
				errorInfo: (
					<>
						<p>
							{ __(
								'Please take a moment to check the license key from your purchase confirmation email—it might have a small typo.',
								'jetpack'
							) }
						</p>

						<p>{ needHelpGetInTouchLink }</p>
					</>
				),
			};
		case LICENSE_ERRORS.MULTISITE_INCOMPATIBILITY: {
			const planNameMatch = licenseError.match( /We.re sorry, (.*) is not compatible/ );
			const planName = planNameMatch && planNameMatch[ 1 ];
			return {
				errorMessage: sprintf(
					/* translators: %s is the Jetpack product name, i.e.- Jetpack Backup, Jetpack Boost, etc., which the product name should not be translated. */
					__(
						'We’re sorry, %s is not compatible with multisite WordPress installations at this time.',
						'jetpack'
					),
					planName
				),
				errorInfo: (
					<>
						<p>
							{ __(
								'This Jetpack plan doesn’t work with Multisite WordPress setups. Please use it on a single-site installation or consider canceling for a refund.',
								'jetpack'
							) }
						</p>
						<p>{ needHelpGetInTouchLink }</p>
					</>
				),
			};
		}
		default:
			return {
				errorMessage: licenseError,
				errorInfo: <p>{ needHelpGetInTouchLink }</p>,
			};
	}
};
