import { useCallback, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, key, shield, wordpress } from '@wordpress/icons';
import { Button, ButtonLink, Dialog, Text } from '@wordpress/ui';
import gauge from '../../sections/monitor/icon';
import { SafeShield } from '../../sections/scan/safe-state';
import './style.scss';
import type { ReactElement, ReactNode } from 'react';

const LEARN_MORE_URL = 'https://jetpack.com/protect/';
const SEEN_KEY = `jetpack-protect-welcome-seen-${ window.location.host }`;

/**
 * Whether the welcome modal was already dismissed in this browser.
 *
 * @return True once dismissed; also true when storage is unreadable, so it never nags.
 */
function hasSeenWelcome(): boolean {
	try {
		return window.localStorage.getItem( SEEN_KEY ) === '1';
	} catch {
		return true;
	}
}

/**
 * Remember the dismissal, ignoring unavailable storage.
 */
function saveDismissal(): void {
	try {
		window.localStorage.setItem( SEEN_KEY, '1' );
	} catch {
		// Private browsing or full quota: the modal just greets them again next load.
	}
}

type WelcomeCard = {
	icon: ReactNode;
	title: string;
	body: string;
};

const CARDS: WelcomeCard[] = [
	{
		icon: <Icon icon={ shield } size={ 24 } />,
		title: __( 'Scan for threats', 'jetpack-protect-pkg' ),
		body: __(
			'We check WordPress, your plugins and themes against a database of known vulnerabilities every day.',
			'jetpack-protect-pkg'
		),
	},
	{
		icon: <Icon icon={ wordpress } size={ 24 } />,
		title: __( 'Block attacks at the door', 'jetpack-protect-pkg' ),
		body: __(
			'The firewall stops malicious requests before they ever reach your site.',
			'jetpack-protect-pkg'
		),
	},
	{
		icon: <Icon icon={ key } size={ 24 } />,
		title: __( 'Stop password guessing', 'jetpack-protect-pkg' ),
		body: __(
			'Brute force protection blocks bots that hammer your login page.',
			'jetpack-protect-pkg'
		),
	},
	{
		icon: <Icon icon={ gauge } size={ 24 } />,
		title: __( 'Know when you’re down', 'jetpack-protect-pkg' ),
		body: __(
			'Downtime monitoring checks your site every few minutes and emails you if it goes offline.',
			'jetpack-protect-pkg'
		),
	},
];

/**
 * First-visit welcome modal explaining what the Protect dashboard does. `&welcome=1` re-opens it.
 *
 * @return The modal.
 */
export default function WelcomeModal(): ReactElement {
	const [ isOpen, setIsOpen ] = useState(
		() =>
			new URLSearchParams( window.location.search ).get( 'welcome' ) === '1' || ! hasSeenWelcome()
	);
	const popupRef = useRef< HTMLDivElement >( null );

	const dismiss = useCallback( () => {
		saveDismissal();
		setIsOpen( false );
	}, [] );
	const onOpenChange = useCallback(
		( open: boolean ) => {
			if ( ! open ) {
				dismiss();
			}
		},
		[ dismiss ]
	);

	return (
		<Dialog.Root open={ isOpen } onOpenChange={ onOpenChange }>
			{ /* Focusing the popup announces the title and lede first, rather than the close button. */ }
			<Dialog.Popup
				ref={ popupRef }
				initialFocus={ popupRef }
				size="medium"
				className="jp-protect-welcome"
			>
				<div className="jp-protect-welcome__band">
					<Dialog.CloseIconButton
						className="jp-protect-welcome__close"
						label={ __( 'Close', 'jetpack-protect-pkg' ) }
					/>
					<SafeShield justScanned={ isOpen } />
				</div>

				<Dialog.Content className="jp-protect-welcome__body">
					<Dialog.Title>
						{ __( 'Your site’s security, in one place', 'jetpack-protect-pkg' ) }
					</Dialog.Title>
					<Dialog.Description className="jp-protect-welcome__lede">
						{ __(
							'Protect watches your site around the clock. It finds vulnerabilities, blocks attacks, and tells you when something needs your attention — so you can get back to building.',
							'jetpack-protect-pkg'
						) }
					</Dialog.Description>

					{ /* list-style: none strips list semantics in Safari; the role restores them. */ }
					<ul className="jp-protect-welcome__cards" role="list">
						{ CARDS.map( card => (
							<li key={ card.title } className="jp-protect-welcome__card">
								<span className="jp-protect-welcome__card-icon" aria-hidden="true">
									{ card.icon }
								</span>
								<span className="jp-protect-welcome__card-text">
									<Text
										variant="heading-md"
										render={ <span /> }
										className="jp-protect-welcome__card-title"
									>
										{ card.title }
									</Text>
									<Text
										variant="body-md"
										render={ <span /> }
										className="jp-protect-welcome__card-body"
									>
										{ card.body }
									</Text>
								</span>
							</li>
						) ) }
					</ul>
				</Dialog.Content>

				<Dialog.Footer className="jp-protect-welcome__footer">
					<ButtonLink variant="minimal" tone="neutral" href={ LEARN_MORE_URL } openInNewTab>
						{ __( 'Learn more', 'jetpack-protect-pkg' ) }
					</ButtonLink>
					<Button variant="solid" tone="neutral" onClick={ dismiss }>
						{ __( 'Got it', 'jetpack-protect-pkg' ) }
					</Button>
				</Dialog.Footer>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
