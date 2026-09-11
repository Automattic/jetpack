import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import { createInterpolateElement, useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link, Notice } from '@wordpress/ui';
import { getNewsletterScriptData } from '../../../src/settings/script-data';
import './subscriber-count-notice.scss';

const CONTACT_URL = 'https://wordpress.com/help/contact';

/**
 * Temporary WordPress.com notice explaining the subscriber-count shift from the
 * duplicate-record merge. Dismissing stamps user meta so it never comes back.
 *
 * @return The notice, or null once dismissed or off WordPress.com.
 */
export default function SubscriberCountNotice(): JSX.Element | null {
	const scriptData = getNewsletterScriptData();
	const [ isDismissed, setDismissed ] = useState( false );
	// The Help Center store is registered by wpcom's admin chrome, not on every screen.
	const helpCenter = useDispatch( 'automattic/help-center' ) as
		| { setShowHelpCenter?: ( show: boolean ) => void }
		| undefined;
	const setShowHelpCenter = helpCenter?.setShowHelpCenter;

	const metaKey = scriptData?.subscriberCountNoticeMetaKey;
	const dismiss = useCallback( () => {
		setDismissed( true );
		if ( ! metaKey ) {
			return;
		}
		apiFetch( {
			path: '/wp/v2/users/me',
			method: 'POST',
			data: { meta: { [ metaKey ]: true } },
		} ).catch( () => {
			// A failed write only means the notice returns on the next load.
		} );
	}, [ metaKey ] );

	const openHelpCenter = useCallback(
		( event: React.MouseEvent ) => {
			if ( ! setShowHelpCenter ) {
				return;
			}
			event.preventDefault();
			setShowHelpCenter( true );
		},
		[ setShowHelpCenter ]
	);

	if ( isDismissed || ! scriptData?.showSubscriberCountNotice ) {
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
						a: <Link href={ CONTACT_URL } openInNewTab onClick={ openHelpCenter } />,
					}
				) }
			</Notice.Description>
			<Notice.CloseIcon label={ __( 'Dismiss', 'jetpack-newsletter' ) } onClick={ dismiss } />
		</Notice.Root>
	);
}
