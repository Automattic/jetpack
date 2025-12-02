/**
 * External dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import type { JetpackNewsletterSettings } from '../types';

interface PaidNewsletterSectionProps {
	jetpackSettings: JetpackNewsletterSettings | undefined;
}

/**
 * Paid Newsletter Section Component
 *
 * @param {PaidNewsletterSectionProps} props - Component props
 * @return {JSX.Element | null} The paid newsletter section or null if URL not available
 */
export function PaidNewsletterSection( {
	jetpackSettings,
}: PaidNewsletterSectionProps ): JSX.Element | null {
	if ( ! jetpackSettings?.setupPaymentPlansUrl ) {
		return null;
	}

	return (
		<div className="newsletter-settings__section">
			<h3 className="newsletter-settings__section-title">
				{ __( 'Paid Newsletter', 'jetpack-newsletter' ) }
			</h3>
			<div className="newsletter-settings__section-content">
				<p>
					{ __(
						'Earn money through your Newsletter. Reward your most loyal subscribers with exclusive content or add a paywall to monetize content.',
						'jetpack-newsletter'
					) }
				</p>
				<Button
					variant="primary"
					href={ jetpackSettings.setupPaymentPlansUrl }
					target="_blank"
					rel="noopener noreferrer"
				>
					{ __( 'Add Plans', 'jetpack-newsletter' ) }
				</Button>
			</div>
		</div>
	);
}
