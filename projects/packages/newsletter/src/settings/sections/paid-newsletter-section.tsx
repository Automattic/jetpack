/**
 * External dependencies
 */
import analytics from '@automattic/jetpack-analytics';
import { getSiteType } from '@automattic/jetpack-script-data';
import {
	Button,
	Card,
	CardHeader,
	CardBody,
	__experimentalText as Text, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalHeading as Heading, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
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
		<Card>
			<CardHeader>
				<Heading level={ 4 }>{ __( 'Paid newsletter', 'jetpack-newsletter' ) }</Heading>
			</CardHeader>
			<CardBody>
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
			</CardBody>
		</Card>
	);
}
