/**
 * External dependencies
 */
import analytics from '@automattic/jetpack-analytics';
import { getSiteType } from '@automattic/jetpack-script-data';
import { Button } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { external } from '@wordpress/icons';
import { Card, Stack, Text } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import { getNewsletterScriptData } from '../script-data';

interface PaidNewsletterSectionProps {
	isNewsletterEnabled: boolean;
}

/**
 * Paid Newsletter Section Component
 *
 * @param {PaidNewsletterSectionProps} props - Component props
 * @return {JSX.Element | null} The paid newsletter section or null if URL not available
 */
export function PaidNewsletterSection( {
	isNewsletterEnabled,
}: PaidNewsletterSectionProps ): JSX.Element | null {
	const siteType = getSiteType();
	const newsletterScriptData = getNewsletterScriptData();

	const handlePaidPlansClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_newsletter_paid_plans_click', {
			site_type: siteType,
		} );
	}, [ siteType ] );

	if ( ! newsletterScriptData?.setupPaymentPlansUrl ) {
		return null;
	}

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>{ __( 'Paid newsletter', 'jetpack-newsletter' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" gap="lg">
					<Text>
						{ __(
							'Earn money through your Newsletter. Reward your most loyal subscribers with exclusive content or add a paywall to monetize content.',
							'jetpack-newsletter'
						) }
					</Text>
					<fieldset
						className="jetpack-newsletter-section__fieldset"
						disabled={ ! isNewsletterEnabled }
					>
						<Button
							size="compact"
							variant="primary"
							href={ newsletterScriptData.setupPaymentPlansUrl }
							target="_blank"
							rel="noopener noreferrer"
							icon={ external }
							iconPosition="right"
							disabled={ ! isNewsletterEnabled }
							onClick={ handlePaidPlansClick }
						>
							{ __( 'Manage plans', 'jetpack-newsletter' ) }
						</Button>
					</fieldset>
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}
