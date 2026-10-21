import { Guide } from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, key, shield, wordpress } from '@wordpress/icons';
import gauge from '../../sections/monitor/icon';
import { SafeShield } from '../../sections/scan/safe-state';
import './style.scss';
import type { ReactElement, ReactNode } from 'react';

const SEEN_KEY = `jetpack-protect-welcome-seen-${ window.location.host }`;

/**
 * Whether the welcome guide was already dismissed in this browser.
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
		// Private browsing or full quota: the guide just greets them again next load.
	}
}

type WelcomePage = {
	art: ReactNode;
	title: string;
	body: string;
};

/**
 * The guide's pages: what the dashboard is, then one per thing it does.
 *
 * @return The pages, translated at render time.
 */
const getPages = (): WelcomePage[] => [
	{
		art: <SafeShield justScanned />,
		title: __( 'Your site’s security, in one place', 'jetpack-protect-pkg' ),
		body: __(
			'Protect watches your site around the clock and tells you when something needs your attention. Here’s what it does for you.',
			'jetpack-protect-pkg'
		),
	},
	{
		art: <Icon icon={ shield } size={ 64 } />,
		title: __( 'Scan for threats', 'jetpack-protect-pkg' ),
		body: __(
			'Every day we check WordPress, your plugins and themes against a database of known vulnerabilities, and show you how to fix what we find.',
			'jetpack-protect-pkg'
		),
	},
	{
		art: <Icon icon={ wordpress } size={ 64 } />,
		title: __( 'Block attacks at the door', 'jetpack-protect-pkg' ),
		body: __(
			'The firewall stops malicious requests before they ever reach your site, with rules that update automatically.',
			'jetpack-protect-pkg'
		),
	},
	{
		art: <Icon icon={ key } size={ 64 } />,
		title: __( 'Stop password guessing', 'jetpack-protect-pkg' ),
		body: __(
			'Brute force protection blocks bots that hammer your login page, so only real people get a chance to sign in.',
			'jetpack-protect-pkg'
		),
	},
	{
		art: <Icon icon={ gauge } size={ 64 } />,
		title: __( 'Know the moment you’re down', 'jetpack-protect-pkg' ),
		body: __(
			'Downtime monitoring checks your site every few minutes and emails you if it goes offline — and again when it’s back.',
			'jetpack-protect-pkg'
		),
	},
];

/**
 * First-visit welcome guide explaining what the Protect dashboard does. `&welcome=1` re-opens it.
 *
 * @return The guide, or null once dismissed.
 */
export default function WelcomeModal(): ReactElement | null {
	const [ isOpen, setIsOpen ] = useState(
		() =>
			new URLSearchParams( window.location.search ).get( 'welcome' ) === '1' || ! hasSeenWelcome()
	);

	const dismiss = useCallback( () => {
		saveDismissal();
		setIsOpen( false );
	}, [] );

	if ( ! isOpen ) {
		return null;
	}

	return (
		<Guide
			className="jp-protect-welcome"
			contentLabel={ __( 'Welcome to Protect', 'jetpack-protect-pkg' ) }
			finishButtonText={ __( 'Get started', 'jetpack-protect-pkg' ) }
			onFinish={ dismiss }
			pages={ getPages().map( ( page, index ) => ( {
				image: (
					<div
						className={ `jp-protect-welcome__art jp-protect-welcome__art--${ index + 1 }` }
						aria-hidden="true"
					>
						<span className="jp-protect-welcome__art-badge">{ page.art }</span>
					</div>
				),
				content: (
					<>
						<h1 className="jp-protect-welcome__heading">{ page.title }</h1>
						<p className="jp-protect-welcome__text">{ page.body }</p>
					</>
				),
			} ) ) }
		/>
	);
}
