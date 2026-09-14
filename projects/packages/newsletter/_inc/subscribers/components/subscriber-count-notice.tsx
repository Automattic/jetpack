import { getAdminUrl } from '@automattic/jetpack-script-data';
import { dispatch } from '@wordpress/data';
import { createInterpolateElement, useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link, Notice } from '@wordpress/ui';
import { getNewsletterScriptData } from '../../../src/settings/script-data';
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
	const scriptData = getNewsletterScriptData();
	const nonce = scriptData?.subscriberCountNoticeNonce ?? '';

	const dismiss = useCallback( () => {
		setDismissed( true );
		fetch( getAdminUrl( 'admin-ajax.php' ), {
			method: 'POST',
			body: new URLSearchParams( {
				action: 'jetpack_newsletter_dismiss_subscriber_count_notice',
				_ajax_nonce: nonce,
			} ),
		} ).catch( () => {
			// A failed write only means the notice returns on the next load.
		} );
	}, [ nonce ] );

	if ( isDismissed || ! scriptData?.showSubscriberCountNotice ) {
		return null;
	}

	return (
		<Notice.Root
			intent="info"
			style={ {
				marginBlockStart: 'var(--wpds-dimension-padding-lg)',
				marginInline: 'var(--wpds-dimension-padding-lg)',
			} }
		>
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
						a: <Link href="https://wordpress.com/help/contact" onClick={ openHelpCenter } />,
					}
				) }
			</Notice.Description>
			<Notice.CloseIcon label={ __( 'Dismiss', 'jetpack-newsletter' ) } onClick={ dismiss } />
		</Notice.Root>
	);
}
