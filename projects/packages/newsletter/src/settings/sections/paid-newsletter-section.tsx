/**
 * External dependencies
 */
import analytics from '@automattic/jetpack-analytics';
import { getSiteType } from '@automattic/jetpack-script-data';
import { Button } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Card, Text } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import { getNewsletterScriptData } from '../script-data';

interface PaidNewsletterSectionProps {
	isNewsletterEnabled: boolean;
	hasActivePlan?: boolean;
}

/**
 * Paid Newsletter Section Component
 *
 * Uses `@wordpress/components` Button + a native `<fieldset>` because this is
 * the one button-as-link case in the dashboard. WP UI's Button rendered as
 * `<a>` (`render={ <a /> }`) inherits wp-admin's global `a { color: #2271b1 }`
 * — that rule is unlayered, while WP UI's button color sits in
 * `@layer wp-ui-components`, and unlayered always wins over layered. Worth a
 * Gutenberg-side fix; out of scope for this PR.
 *
 * @param {PaidNewsletterSectionProps} props - Component props
 * @return {JSX.Element | null} The paid newsletter section or null if URL not available
 */
export function PaidNewsletterSection( {
	isNewsletterEnabled,
	hasActivePlan = false,
}: PaidNewsletterSectionProps ): JSX.Element | null {
	const siteType = getSiteType();
	const newsletterScriptData = getNewsletterScriptData();

	// Track paid plans button click
	const handlePaidPlansClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_newsletter_paid_plans_click', {
			site_type: siteType,
			has_active_plan: !! hasActivePlan,
		} );
	}, [ hasActivePlan, siteType ] );

	if ( ! newsletterScriptData?.setupPaymentPlansUrl ) {
		return null;
	}

	// Button text based on whether they have an active plan
	const addPlansText = __( 'Add plans', 'jetpack-newsletter' );
	const managePlansText = __( 'Manage plans', 'jetpack-newsletter' );
	const buttonText = hasActivePlan ? managePlansText : addPlansText;

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>{ __( 'Paid newsletter', 'jetpack-newsletter' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				<p>
					<Text>
						{ __(
							'Earn money through your Newsletter. Reward your most loyal subscribers with exclusive content or add a paywall to monetize content.',
							'jetpack-newsletter'
						) }
					</Text>
				</p>
				<fieldset disabled={ ! isNewsletterEnabled }>
					<Button
						__next40pxDefaultSize
						variant="primary"
						href={ newsletterScriptData.setupPaymentPlansUrl }
						target="_blank"
						rel="noopener noreferrer"
						disabled={ ! isNewsletterEnabled }
						onClick={ handlePaidPlansClick }
					>
						{ buttonText }
					</Button>
				</fieldset>
			</Card.Content>
		</Card.Root>
	);
}
