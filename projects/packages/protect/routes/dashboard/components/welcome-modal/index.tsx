import { Guide } from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, key, shield } from '@wordpress/icons';
import gauge from '../../sections/monitor/icon';
import { SafeShield } from '../../sections/scan/safe-state';
import ScanArt, { SCAN_ART_VARIANTS, type ScanArtVariant } from './scan-art';
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
	extra?: ReactNode;
};

/**
 * The tools that joined Scan in Protect, in the dashboard's card order.
 *
 * @return Icon and name for each.
 */
const getBundledFeatures = () => [
	{ icon: gauge, name: __( 'Downtime monitoring', 'jetpack-protect-pkg' ) },
	{ icon: shield, name: __( 'Firewall', 'jetpack-protect-pkg' ) },
	{ icon: key, name: __( 'Login protection', 'jetpack-protect-pkg' ) },
];

/**
 * The guide's pages: the new dashboard, Scan, then what's now bundled in.
 *
 * @param scanArt - Which Scan header exploration to show.
 * @return The pages, translated at render time.
 */
const getPages = ( scanArt: ScanArtVariant ): WelcomePage[] => [
	{
		art: (
			<span className="jp-protect-welcome__art-badge">
				<SafeShield justScanned />
			</span>
		),
		title: __( 'Meet the new Protect', 'jetpack-protect-pkg' ),
		body: __(
			'Everything that keeps your site safe now lives on one dashboard. See your security status at a glance, and fix issues without leaving the page.',
			'jetpack-protect-pkg'
		),
	},
	{
		art: <ScanArt variant={ scanArt } />,
		title: __( 'Scan for threats', 'jetpack-protect-pkg' ),
		body: __(
			'Every day we check WordPress, your plugins and themes against a database of known vulnerabilities, and show you how to fix what we find.',
			'jetpack-protect-pkg'
		),
	},
	{
		art: (
			<span className="jp-protect-welcome__art-trio">
				{ getBundledFeatures().map( feature => (
					<span key={ feature.name } className="jp-protect-welcome__art-badge is-small">
						<Icon icon={ feature.icon } size={ 32 } />
					</span>
				) ) }
			</span>
		),
		title: __( 'More protection, now built in', 'jetpack-protect-pkg' ),
		body: __(
			'These tools now come with Protect. Turn them on and manage them right here.',
			'jetpack-protect-pkg'
		),
		extra: (
			<ul className="jp-protect-welcome__features" role="list">
				{ getBundledFeatures().map( feature => (
					<li key={ feature.name }>
						<Icon icon={ feature.icon } size={ 20 } />
						{ feature.name }
					</li>
				) ) }
			</ul>
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

	// Exploration switch: `&scan_art=radar` etc. picks the Scan page's header.
	const [ scanArt ] = useState( () => {
		const requested = new URLSearchParams( window.location.search ).get( 'scan_art' );
		return SCAN_ART_VARIANTS.find( variant => variant === requested ) ?? SCAN_ART_VARIANTS[ 0 ];
	} );

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
			pages={ getPages( scanArt ).map( ( page, index ) => ( {
				image: (
					<div
						className={ `jp-protect-welcome__art jp-protect-welcome__art--${ index + 1 }` }
						aria-hidden="true"
					>
						{ page.art }
					</div>
				),
				content: (
					<>
						<h1 className="jp-protect-welcome__heading">{ page.title }</h1>
						<p className="jp-protect-welcome__text">{ page.body }</p>
						{ page.extra }
					</>
				),
			} ) ) }
		/>
	);
}
