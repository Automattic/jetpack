/**
 * External dependencies
 */
import analytics from '@automattic/jetpack-analytics';
import { getSiteType } from '@automattic/jetpack-script-data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Card, LinkButton, Stack, Text } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import { getNewsletterScriptData } from '../script-data';
import type { JSX } from 'react';

/**
 * Email Design Section Component.
 *
 * Links out to the email design screen, which is its own editor rather than
 * settings on this page.
 *
 * @return {JSX.Element | null} The email design section, or null on a site that has no such screen.
 */
export function EmailDesignSection(): JSX.Element | null {
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
					<LinkButton variant="solid" href={ emailDesignUrl } onClick={ handleEmailDesignClick }>
						{ __( 'Edit email design', 'jetpack-newsletter' ) }
					</LinkButton>
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}
