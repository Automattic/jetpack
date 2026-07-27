import {
	Button,
	Modal,
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalInputControl as InputControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { useCallback, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { check, copy, share } from '@wordpress/icons';
import { SocialLogo } from 'social-logos';
import { recordTracksEvent } from '../subscribers/lib/tracks';
import { getShareLinks, getShareText } from './share-links';
import './share-newsletter-modal.scss';

const COPIED_FEEDBACK_MS = 3000;

type Props = {
	/** Absolute URL of the newsletter being shared. */
	siteUrl: string;
	onClose: () => void;
};

/**
 * "Share your newsletter" — a copy-able URL plus one-tap handoffs to the
 * services people actually share links on.
 *
 * Ported from Calypso's `packages/launchpad/src/action-components/share-site-modal`.
 * Three things changed on the way over: Tracks goes through this package's
 * `recordTracksEvent` rather than `calypso-analytics`; the URL arrives as a prop
 * from script data instead of a `SiteDetails` object; and the launchpad
 * completion write is dropped, since this dashboard's checklist isn't backed by
 * saved state yet. The share destinations themselves live in `share-links.ts`.
 *
 * @param props         - Component props.
 * @param props.siteUrl - Absolute URL of the newsletter being shared.
 * @param props.onClose - Close handler.
 * @return The modal.
 */
export default function ShareNewsletterModal( { siteUrl, onClose }: Props ): JSX.Element {
	const [ copied, setCopied ] = useState( false );
	const copyTimer = useRef< ReturnType< typeof setTimeout > | undefined >( undefined );

	// The field shows the bare host — it's the recognizable part, and the full
	// URL would wrap — while copy and share still hand over the whole thing.
	const host = useMemo( () => {
		try {
			return new URL( siteUrl ).host;
		} catch {
			return siteUrl;
		}
	}, [ siteUrl ] );

	const shareData = useMemo(
		() => ( { title: host, text: getShareText( siteUrl ), url: siteUrl } ),
		[ host, siteUrl ]
	);

	const shareLinks = useMemo(
		() => getShareLinks( siteUrl, shareData.text ),
		[ siteUrl, shareData.text ]
	);

	useEffect( () => () => clearTimeout( copyTimer.current ), [] );

	const handleCopy = useCallback( () => {
		navigator.clipboard?.writeText( siteUrl );
		recordTracksEvent( 'jetpack_subscribers_share_site', { type: 'copy' } );
		setCopied( true );
		clearTimeout( copyTimer.current );
		copyTimer.current = setTimeout( () => setCopied( false ), COPIED_FEEDBACK_MS );
	}, [ siteUrl ] );

	// The OS share sheet — only offered where the browser has one, so it isn't a
	// dead button on desktop Firefox and friends.
	const canWebShare =
		typeof navigator !== 'undefined' && !! navigator.canShare?.( shareData ) && !! navigator.share;

	// One handler for every service link — the service is read back off the
	// element, so the list doesn't mint a fresh closure per row.
	const handleServiceClick = useCallback( ( event: React.MouseEvent< HTMLElement > ) => {
		const { service } = event.currentTarget.dataset;

		if ( service ) {
			recordTracksEvent( 'jetpack_subscribers_share_site', { type: service } );
		}
	}, [] );

	const handleWebShare = useCallback( async () => {
		recordTracksEvent( 'jetpack_subscribers_share_site', { type: 'web-share' } );
		try {
			await navigator.share( shareData );
		} catch {
			// Dismissing the OS sheet rejects; that's a normal outcome, not an error.
		}
	}, [ shareData ] );

	return (
		// `Modal` from `@wordpress/components` rather than `Dialog` from
		// `@wordpress/ui`, which the sibling Add Subscribers modal uses: this route
		// externalizes `wp-components` but bundles `@wordpress/ui`, so `Dialog`
		// would drag base-ui and floating-ui into the page for one modal —
		// measured at +297KB minified. Calypso's original uses `Modal` too.
		<Modal
			title={ __( 'Share your newsletter', 'jetpack-newsletter' ) }
			onRequestClose={ onClose }
			className="jetpack-newsletter-share"
		>
			<VStack spacing={ 4 }>
				<InputControl
					__next40pxDefaultSize
					value={ host }
					label={ __( 'Newsletter URL', 'jetpack-newsletter' ) }
					hideLabelFromVision
					readOnly
					suffix={
						<Button
							icon={ copied ? check : copy }
							label={ __( 'Copy newsletter URL', 'jetpack-newsletter' ) }
							onClick={ handleCopy }
							disabled={ copied }
							// A disabled control drops out of the tab order and stops
							// announcing, which would swallow the "copied" feedback for
							// anyone who just activated it from the keyboard.
							accessibleWhenDisabled
						/>
					}
				/>
				<HStack
					as="ul"
					justify="start"
					wrap
					spacing={ 3 }
					className="jetpack-newsletter-share__services"
				>
					{ canWebShare && (
						<li>
							<Button
								className="jetpack-newsletter-share__service"
								icon={ share }
								onClick={ handleWebShare }
							>
								{ __( 'Share via device', 'jetpack-newsletter' ) }
							</Button>
						</li>
					) }
					{ shareLinks.map( link => (
						<li key={ link.service }>
							<Button
								className="jetpack-newsletter-share__service"
								href={ link.href }
								label={ link.title }
								target="_blank"
								rel="noopener noreferrer"
								data-service={ link.service }
								onClick={ handleServiceClick }
							>
								<SocialLogo
									className="jetpack-newsletter-share__service-icon"
									size={ 24 }
									icon={ link.service }
								/>
								<span>{ link.label }</span>
							</Button>
						</li>
					) ) }
				</HStack>
			</VStack>
		</Modal>
	);
}
