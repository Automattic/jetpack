/**
 * External dependencies
 */
import analytics from '@automattic/jetpack-analytics';
import { getSiteType } from '@automattic/jetpack-script-data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Card, LinkButton, Stack, Text } from '@wordpress/ui';
import { addQueryArgs } from '@wordpress/url';
/**
 * Internal dependencies
 */
import { getNewsletterScriptData } from '../script-data';
import type { JSX } from 'react';

interface EmailDesignSectionProps {
	isNewsletterEnabled: boolean;
}

/**
 * Email Design Section Component.
 *
 * Links out to the email design screen, which is its own editor rather than
 * settings on this page.
 *
 * @param {EmailDesignSectionProps} props                     - Component props
 * @param                           props.isNewsletterEnabled - Whether the Newsletter module is on.
 * @return {JSX.Element | null} The email design section, or null on a site that has no such screen.
 */
export function EmailDesignSection( {
	isNewsletterEnabled,
}: EmailDesignSectionProps ): JSX.Element | null {
	const siteType = getSiteType();
	const emailDesignUrl = getNewsletterScriptData()?.emailDesignUrl;

	const handleEmailDesignClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_newsletter_email_design_click', {
			site_type: siteType,
		} );
	}, [ siteType ] );

	if ( ! emailDesignUrl ) {
		return null;
	}

	const buttonText = __( 'Edit email design', 'jetpack-newsletter' );

	// So the editor's back button returns here rather than to the dashboard.
	const href = addQueryArgs( emailDesignUrl, { return: window.location.href } );

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>{ __( 'Email design', 'jetpack-newsletter' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" gap="xl" align="start">
					<Text variant="body-md" render={ <p /> }>
						{ __(
							'Set the colors, fonts, and layout your subscribers see in their inbox.',
							'jetpack-newsletter'
						) }
					</Text>
					{ isNewsletterEnabled ? (
						<LinkButton variant="solid" href={ href } onClick={ handleEmailDesignClick }>
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
