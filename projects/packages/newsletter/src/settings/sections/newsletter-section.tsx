/**
 * External dependencies
 */
import analytics from '@automattic/jetpack-analytics';
import { getSiteType } from '@automattic/jetpack-script-data';
import { ExternalLink } from '@wordpress/components';
import { DataForm, type Field } from '@wordpress/dataviews/wp';
import { useCallback, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { getNewsletterScriptData } from '../script-data';
import type { NewsletterSettings } from '../types';

interface NewsletterSectionProps {
	data: NewsletterSettings;
	onChange: ( updates: Partial< NewsletterSettings > ) => void;
}

/**
 * Newsletter Section Component
 *
 * @param {NewsletterSectionProps} props - Component props
 * @return {JSX.Element} The newsletter section
 */
export function NewsletterSection( { data, onChange }: NewsletterSectionProps ): JSX.Element {
	const newsletterScriptData = getNewsletterScriptData();
	const siteType = getSiteType();
	const previousSubscriptionsValue = useRef( data.subscriptions );

	// Wrap onChange to track module toggle
	const handleChange = useCallback(
		( updates: Partial< NewsletterSettings > ) => {
			if (
				'subscriptions' in updates &&
				updates.subscriptions !== previousSubscriptionsValue.current
			) {
				analytics.tracks.recordEvent( 'jetpack_newsletter_module_toggle', {
					site_type: siteType,
					enabled: !! updates.subscriptions,
				} );
				previousSubscriptionsValue.current = !! updates.subscriptions;
			}
			onChange( updates );
		},
		[ onChange, siteType ]
	);

	// Track manage subscribers click
	const handleManageSubscribersClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_newsletter_manage_subscribers_click', {
			site_type: siteType,
		} );
	}, [ siteType ] );

	const fields: Field< NewsletterSettings >[] = [
		{
			id: 'subscriptions',
			label: __(
				'Let visitors subscribe to this site and receive emails when you publish a post',
				'jetpack-newsletter'
			),
			type: 'boolean' as const,
			Edit: 'toggle' as const,
		},
	];

	return (
		<div className="newsletter-settings__section">
			<h3 className="newsletter-settings__section-title">
				{ __( 'Newsletter', 'jetpack-newsletter' ) }
			</h3>
			<div className="newsletter-settings__section-content">
				<DataForm
					data={ data }
					fields={ fields }
					form={ {
						layout: {
							type: 'regular',
							labelPosition: 'top',
						},
						fields: [ 'subscriptions' ],
					} }
					onChange={ handleChange }
				/>
				{ data.subscriptions && newsletterScriptData && (
					<div>
						<ExternalLink
							href={ newsletterScriptData.subscriberManagementUrl }
							onClick={ handleManageSubscribersClick }
						>
							{ __( 'Manage all subscribers', 'jetpack-newsletter' ) }
						</ExternalLink>
					</div>
				) }
			</div>
		</div>
	);
}
