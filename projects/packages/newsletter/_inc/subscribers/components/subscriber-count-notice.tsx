import apiFetch from '@wordpress/api-fetch';
import { dispatch } from '@wordpress/data';
import { createInterpolateElement, useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link, Notice } from '@wordpress/ui';
import { getNewsletterScriptData } from '../../../src/settings/script-data';
import './subscriber-count-notice.scss';
import type { MouseEvent } from 'react';

/**
 * Open the Help Center in place, or let the link fall through to the contact page.
 *
 * @param event - The link click.
 */
function openHelpCenter( event: MouseEvent ) {
	// The Help Center store is registered by wpcom's admin chrome, not on every screen.
	const helpCenter = dispatch( 'automattic/help-center' ) as {
		setShowHelpCenter?: ( show: boolean ) => void;
	} | null;
	if ( helpCenter?.setShowHelpCenter ) {
		event.preventDefault();
		helpCenter.setShowHelpCenter( true );
	}
}

/**
 * Temporary WordPress.com notice explaining the subscriber-count shift from the
 * duplicate-record merge. Dismissing stamps user meta so it never comes back.
 *
 * @return The notice, or null once dismissed or off WordPress.com.
 */
export default function SubscriberCountNotice(): JSX.Element | null {
	const [ isDismissed, setDismissed ] = useState( false );

	const dismiss = useCallback( () => {
		setDismissed( true );
		apiFetch( {
			path: '/wp/v2/users/me',
			method: 'POST',
			data: { meta: { jetpack_newsletter_subscriber_count_notice_dismissed: true } },
		} ).catch( () => {
			// A failed write only means the notice returns on the next load.
		} );
	}, [] );

	if ( isDismissed || ! getNewsletterScriptData()?.showSubscriberCountNotice ) {
		return null;
	}

	return (
		<Notice.Root intent="info" className="jetpack-newsletter-subscriber-count-notice">
			<Notice.Title>
				{ __( 'Your subscriber count is now more accurate.', 'jetpack-newsletter' ) }
			</Notice.Title>
			<Notice.Description>
				{ createInterpolateElement(
					__(
						'We found and combined duplicate subscriber records, so you might see a different subscriber count than before. If you have questions, our <a>Happiness Engineers are here to help</a>.',
						'jetpack-newsletter'
					),
					{
						a: (
							<Link
								href="https://wordpress.com/help/contact"
								openInNewTab
								onClick={ openHelpCenter }
							/>
						),
					}
				) }
			</Notice.Description>
			<Notice.CloseIcon label={ __( 'Dismiss', 'jetpack-newsletter' ) } onClick={ dismiss } />
		</Notice.Root>
	);
}
