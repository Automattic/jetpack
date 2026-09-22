/**
 * External dependencies
 */
import analytics from '@automattic/jetpack-analytics';
import { getSiteType } from '@automattic/jetpack-script-data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Card, LinkButton, Stack, Text } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import { getNewsletterScriptData } from '../script-data';

interface PaidNewsletterSectionProps {
	isNewsletterEnabled: boolean;
	hasActivePlan?: boolean;
}

/**
 * Paid Newsletter Section Component.
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
				<Stack direction="column" gap="xl" align="start">
					<Text variant="body-md" render={ <p /> }>
						{ __(
							'Earn money through your Newsletter. Reward your most loyal subscribers with exclusive content or add a paywall to monetize content.',
							'jetpack-newsletter'
						) }
					</Text>
					{ isNewsletterEnabled ? (
						<LinkButton
							variant="solid"
							href={ newsletterScriptData.setupPaymentPlansUrl }
							openInNewTab
							onClick={ handlePaidPlansClick }
						>
							{ buttonText }
						</LinkButton>
					) : (
						<Button variant="solid" disabled>
							{ buttonText }
						</Button>
					) }
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}
