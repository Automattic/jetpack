import analytics from '@automattic/jetpack-analytics';
import { getSiteType } from '@automattic/jetpack-script-data';
import { Icon } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { external } from '@wordpress/icons';
import { Card, Link, Stack } from '@wordpress/ui';
import type { JSX } from 'react';

const GUIDES = [
	{
		id: 'start',
		title: __( 'Start a newsletter', 'jetpack-newsletter' ),
		duration: __( '2 min', 'jetpack-newsletter' ),
		url: 'https://wordpress.com/support/newsletter/',
	},
	{
		id: 'send_emails',
		title: __( 'Send newsletter emails to subscribers', 'jetpack-newsletter' ),
		duration: __( '4 min', 'jetpack-newsletter' ),
		url: 'https://wordpress.com/support/newsletter/send-newsletter-emails/',
	},
	{
		id: 'settings',
		title: __( 'Newsletter settings', 'jetpack-newsletter' ),
		duration: __( '5 min', 'jetpack-newsletter' ),
		url: 'https://wordpress.com/support/newsletter-settings/',
	},
];

type Guide = ( typeof GUIDES )[ number ];

/**
 * One guide link.
 *
 * @param props       - Link props.
 * @param props.guide - Guide to render.
 * @return The guide link.
 */
function GuideLink( { guide }: { guide: Guide } ): JSX.Element {
	const recordClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_newsletter_overview_guide_click', {
			site_type: getSiteType(),
			guide: guide.id,
		} );
	}, [ guide.id ] );

	return (
		<Link
			className="jetpack-newsletter-overview__guide-link"
			href={ guide.url }
			render={ <a target="_blank" rel="noreferrer" /> }
			variant="unstyled"
			onClick={ recordClick }
		>
			<span>
				{ guide.title }{ ' ' }
				<span className="screen-reader-text">
					{ __( 'Opens in a new tab', 'jetpack-newsletter' ) }
				</span>
			</span>
			<Stack
				className="jetpack-newsletter-overview__guide-meta"
				render={ <span /> }
				direction="row"
				gap="md"
				align="center"
			>
				<span>{ guide.duration }</span>
				<Icon icon={ external } size={ 20 } aria-hidden="true" />
			</Stack>
		</Link>
	);
}

/**
 * Render the Newsletter guides card.
 *
 * @return The guides card.
 */
export default function GuidesCard(): JSX.Element {
	return (
		<Card.Root className="jetpack-newsletter-overview__guides">
			<Card.Header>
				<Card.Title>{ __( 'Guides', 'jetpack-newsletter' ) }</Card.Title>
			</Card.Header>
			<Card.Content className="jetpack-newsletter-overview__guides-content">
				<ul className="jetpack-newsletter-overview__guides-list">
					{ GUIDES.map( guide => (
						<li key={ guide.id } className="jetpack-newsletter-overview__guide">
							<GuideLink guide={ guide } />
						</li>
					) ) }
				</ul>
			</Card.Content>
		</Card.Root>
	);
}
