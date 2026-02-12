/**
 * External dependencies
 */
import { Button } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { getSiteType, trackPaidPlansClick } from '../analytics';
import type { JetpackNewsletterSettings } from '../types';

interface PaidNewsletterSectionProps {
	jetpackSettings: JetpackNewsletterSettings | undefined;
	isNewsletterEnabled: boolean;
	hasActivePlan?: boolean;
}

/**
 * Paid Newsletter Section Component
 *
 * @param {PaidNewsletterSectionProps} props - Component props
 * @return {JSX.Element | null} The paid newsletter section or null if URL not available
 */
export function PaidNewsletterSection( {
	jetpackSettings,
	isNewsletterEnabled,
	hasActivePlan = false,
}: PaidNewsletterSectionProps ): JSX.Element | null {
	const siteType = getSiteType( jetpackSettings );

	// Track paid plans button click
	const handlePaidPlansClick = useCallback( () => {
		trackPaidPlansClick( !! hasActivePlan, siteType );
	}, [ hasActivePlan, siteType ] );

	if ( ! jetpackSettings?.setupPaymentPlansUrl ) {
		return null;
	}

	// Button text based on whether they have an active plan
	const buttonText = hasActivePlan
		? __( 'Manage Plans', 'jetpack-newsletter' )
		: __( 'Add Plans', 'jetpack-newsletter' );

	return (
		<div className="newsletter-settings__section">
			<h3 className="newsletter-settings__section-title">
				{ __( 'Paid newsletter', 'jetpack-newsletter' ) }
			</h3>
			<p className="newsletter-settings__section-description">
				{ __(
					'Earn money through your Newsletter. Reward your most loyal subscribers with exclusive content or add a paywall to monetize content.',
					'jetpack-newsletter'
				) }
			</p>
			<fieldset className="newsletter-settings__section-content" disabled={ ! isNewsletterEnabled }>
				<Button
					variant="primary"
					href={ jetpackSettings.setupPaymentPlansUrl }
					target="_blank"
					rel="noopener noreferrer"
					disabled={ ! isNewsletterEnabled }
					onClick={ handlePaidPlansClick }
				>
					{ buttonText }
				</Button>
			</fieldset>
		</div>
	);
}
