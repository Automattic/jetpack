import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Icon, cloudUpload, share, video } from '@wordpress/icons';
import { useNavigate, useSearch } from '@wordpress/route';
import { ThemeProvider } from '@wordpress/theme';
import { Button, Dialog, LinkButton, Text } from '@wordpress/ui';
// The dismissal flag lives with the other first-run storage helpers so the
// redirect and the modal can't drift onto different keys.
import {
	clearDismissal,
	hasPublishedVideo,
	hasSeenOnboarding,
	saveDismissal,
} from '../../hooks/use-first-run-state';
import { useFreeTier } from '../../hooks/use-free-tier';
import { useOnboardingCounts } from '../../hooks/use-onboarding-counts';
import { useUpload } from '../../hooks/use-upload';
import { useUploadIntake } from '../../hooks/use-upload-intake';
import { videoFileAccept } from '../upload-dropzone/video-files';
import IntroVideo, { INTRO_VIDEO_ASPECT, getAssetUrl } from './intro-video';
import './style.scss';
import type { ChangeEvent, CSSProperties, ReactElement, ReactNode } from 'react';

const LEARN_MORE_URL = 'https://jetpack.com/videopress/';

/*
 * The wireframe artwork behind the film — the band's idle state in the Figma
 * spec. It rides the same CopyWebpackPlugin rule as the film (see
 * webpack.config.js), and like the film its URL must be resolved against the
 * build URL rather than written into the stylesheet: the CSS is injected by
 * JS, so `url(images/…)` resolves against `/wp-admin/` and 404s on every load
 * that renders the modal. The stylesheet keeps the flat `#003010` underneath,
 * which is what shows when the URL can't be built.
 */
const WIREFRAME_IMAGE = 'videopress-wireframe.svg';

/*
 * `welcome=1` needs TWO window-scoped values, not one, because the two things
 * it drives have different lifetimes. Every route ships as its own bundle, so
 * an in-app navigation remounts this component with a fresh module scope.
 *
 * CONSUMED: spent by the first mount that sees the param. It gates the
 * side effects — clearing the stored dismissal and stripping the param from
 * the URL — which must happen exactly once. Re-running them on later mounts
 * re-opened the modal on every navigation, after the user had already closed
 * it.
 *
 * ACTIVE: sticky for the rest of the page load. It gates visibility only.
 * The bare `admin.php?page=jetpack-videopress&welcome=1` URL carries no `p`,
 * so it resolves to Library and the layout immediately redirects to /home —
 * remounting this component before anyone has seen anything. With only the
 * consumed latch, that second mount fell through to the empty-library gate,
 * so the modal never appeared on any site that already had a VideoPress
 * video. Dismissal still wins over this flag: `isDismissed` is re-seeded from
 * `hasSeenOnboarding()` on every mount.
 */
const WELCOME_CONSUMED_FLAG = '__jetpackVideoPressWelcomeConsumed';
const WELCOME_ACTIVE_FLAG = '__jetpackVideoPressWelcomeActive';

type WelcomeWindow = Window & {
	[ WELCOME_CONSUMED_FLAG ]?: boolean;
	[ WELCOME_ACTIVE_FLAG ]?: boolean;
};

/*
 * Latches the moment anything reaches the upload queue, and stays latched for
 * the rest of the page load. Window-scoped for the same reason the two flags
 * above are: each route ships its own bundle, so an in-app navigation remounts
 * this component with a fresh module scope.
 *
 * Sticky rather than live, because the queue is not a durable record of what
 * happened. A success row is dropped once a consumer acknowledges it and a
 * failed one once it is retried or cleared — so a gate keyed on the live queue
 * alone would swing back open the instant the user dismissed a failed upload,
 * which is the worst possible moment to greet them as brand new.
 */
const UPLOAD_STARTED_FLAG = '__jetpackVideoPressUploadStarted';

type UploadWindow = Window & { [ UPLOAD_STARTED_FLAG ]?: boolean };

/**
 * Whether an upload has been queued at any point in this page load.
 *
 * @return True once anything has entered the upload queue.
 */
function hasUploadStarted(): boolean {
	return (
		typeof window !== 'undefined' && Boolean( ( window as UploadWindow )[ UPLOAD_STARTED_FLAG ] )
	);
}

/**
 * Record that an upload has been queued in this page load.
 */
function markUploadStarted(): void {
	if ( typeof window !== 'undefined' ) {
		( window as UploadWindow )[ UPLOAD_STARTED_FLAG ] = true;
	}
}

/**
 * Detect the `welcome=1` review param, once, and strip it from the URL.
 *
 * Stripping matters as much as the latch: the param survives in the address
 * bar otherwise, so a manual reload of a URL the user has already dismissed
 * greets them again.
 *
 * @param inRouterSearch - Whether the router's decoded search carries it. On a
 *                       fresh page load the router only parses search it finds
 *                       inside the `p` path param, so the raw query string is
 *                       checked too — `&welcome=1` on admin.php is the easier
 *                       URL to hand around.
 * @return True for the first, unconsumed detection only.
 */
function consumeWelcomeParam( inRouterSearch: boolean ): boolean {
	if ( typeof window === 'undefined' ) {
		return false;
	}

	const scope = window as WelcomeWindow;
	if ( scope[ WELCOME_CONSUMED_FLAG ] ) {
		return false;
	}

	const params = new URLSearchParams( window.location.search );
	if ( ! inRouterSearch && params.get( 'welcome' ) !== '1' ) {
		return false;
	}

	scope[ WELCOME_CONSUMED_FLAG ] = true;
	scope[ WELCOME_ACTIVE_FLAG ] = true;

	if ( params.has( 'welcome' ) ) {
		params.delete( 'welcome' );
		const query = params.toString();
		window.history.replaceState(
			window.history.state,
			'',
			`${ window.location.pathname }${ query ? `?${ query }` : '' }${ window.location.hash }`
		);
	}

	return true;
}

/**
 * Whether this page load arrived via `welcome=1`, on this mount or an earlier
 * one. Read after `consumeWelcomeParam`, which is what sets the flag.
 *
 * @return True for every mount of a welcome load.
 */
function isWelcomeLoad(): boolean {
	return (
		typeof window !== 'undefined' && Boolean( ( window as WelcomeWindow )[ WELCOME_ACTIVE_FLAG ] )
	);
}

/**
 * The band's ThemeProvider wrapper, guarded: the `wp-theme` bundled with core
 * 7.0.x exposes only `privateApis`, so the public `ThemeProvider` import can
 * resolve to undefined — and rendering it crashed the whole dashboard route,
 * since this modal's tree is built on every mount. The band keeps its derived
 * dark scheme where the provider exists and falls back to the stylesheet's
 * colors where it doesn't.
 *
 * @param props          - Component props.
 * @param props.children - The band's content.
 * @return The children, re-themed when the environment allows it.
 */
function BandTheme( { children }: { children: ReactNode } ): ReactElement {
	if ( ! ThemeProvider ) {
		return <>{ children }</>;
	}

	return <ThemeProvider color={ { background: '#003010' } }>{ children }</ThemeProvider>;
}

type ValueCard = {
	icon: ReactNode;
	title: string;
	body: string;
};

/*
 * The three claims the product can keep on day one — deliberately not a
 * feature list, and deliberately not repeating what the video above shows.
 * Copy follows the Figma spec (VideoPress Revival, node 56-12912); the
 * middle body is tightened so all three columns hold the same line count.
 */
const VALUE_CARDS: ValueCard[] = [
	{
		icon: <Icon icon={ video } size={ 24 } />,
		title: __( 'A player you own', 'jetpack-videopress-pkg' ),
		body: __( 'No ads, no logos, and nothing recommended afterwards.', 'jetpack-videopress-pkg' ),
	},
	{
		icon: <Icon icon={ cloudUpload } size={ 24 } />,
		title: __( 'Bring existing videos', 'jetpack-videopress-pkg' ),
		body: __( 'Move library videos over in one click, no re-uploads.', 'jetpack-videopress-pkg' ),
	},
	{
		icon: <Icon icon={ share } size={ 24 } />,
		title: __( 'Share it anywhere', 'jetpack-videopress-pkg' ),
		body: __(
			'Every video gets a link and an embed that work off-site.',
			'jetpack-videopress-pkg'
		),
	},
];

/**
 * First-run VideoPress welcome modal, to the VideoPress Revival Figma spec:
 * a deep-green brand band up top — the intro film playing in the player the
 * modal is selling once a hosted asset is configured, the wireframe artwork
 * on its own until then (see intro-video.tsx) — over a white content area
 * with the headline, three value cards, and a Learn more / Upload a video
 * footer.
 *
 * Built on `@wordpress/ui`'s `Dialog`, matching the modernized dashboard's
 * convention. (The Figma component maps to `@wordpress/components`' Button
 * via Code Connect, but that mapping describes itself as superseded by
 * `@wordpress/ui` — which this package already uses throughout.)
 *
 * The video band is a direct child of `Dialog.Popup`, outside
 * `Dialog.Content`: it is full-bleed chrome, and the padded scroll region
 * would inset it.
 *
 * @return The onboarding modal, or null when it should not be shown.
 */
export default function OnboardingModal(): ReactElement | null {
	const [ isDismissed, setIsDismissed ] = useState( () => hasSeenOnboarding() );
	const { videoPressCount, localCount, isSettled } = useOnboardingCounts();
	// Observer instance, like `useFreeTier`'s: the queue lives in a shared
	// window-scoped store, so reading it here starts nothing and owns nothing.
	const { uploadQueue } = useUpload();
	const intakeFiles = useUploadIntake();
	const { isFree, isUnlimited } = useFreeTier();
	const navigate = useNavigate();
	const search = useSearch( { strict: false } ) as Record< string, unknown >;
	const popupRef = useRef< HTMLDivElement >( null );
	const filePickerRef = useRef< HTMLInputElement >( null );
	// Resolved per render, like the film's own URL: the boot payload is a
	// global, so reading it at module scope would bake in whatever existed when
	// this bundle was imported.
	const wireframeUrl = getAssetUrl( WIREFRAME_IMAGE );

	// `welcome=1` is the review affordance: it reopens the modal regardless of
	// the dismissal flag or the library state, and forgets the stored
	// dismissal so plain loads behave fresh again afterwards. Without it,
	// seeing the modal twice means hand-clearing localStorage.
	//
	// `isPreview` is true only on the mount that spends the param, and it owns
	// the one-shot side effect below. `isWelcomeSession` is true on every mount
	// of the same load and owns visibility — see the two flags above.
	const [ isPreview ] = useState( () => consumeWelcomeParam( search?.welcome === '1' ) );
	const [ isWelcomeSession ] = useState( isWelcomeLoad );

	useEffect( () => {
		if ( isPreview ) {
			clearDismissal();
			setIsDismissed( false );
		}
	}, [ isPreview ] );

	// Anyone with something in the upload queue has already found the upload
	// affordance — the one thing this modal exists to sell — so first run is
	// over for them, count or no count. Without this the gate re-opened behind
	// a legitimately emptied library and the welcome modal covered the screen
	// while the progress panel ran underneath it.
	//
	// The live queue and the latch are both checked: the queue covers the frame
	// an upload starts in (the latch is only written after paint), the latch
	// covers every frame after the queue is cleared. `welcome=1` is deliberately
	// exempt — it is a reviewer explicitly asking for the modal, and it already
	// overrides every other gate here.
	const hasQueuedUpload = uploadQueue.length > 0;
	const [ hasUploadedThisLoad, setHasUploadedThisLoad ] = useState( hasUploadStarted );

	useEffect( () => {
		if ( hasQueuedUpload && ! hasUploadedThisLoad ) {
			markUploadStarted();
			setHasUploadedThisLoad( true );
		}
	}, [ hasQueuedUpload, hasUploadedThisLoad ] );

	// The modal greets anyone who has not used VideoPress yet — including
	// sites whose media library is full of local videos, which is exactly the
	// audience for the migration pitch below. This is deliberately WIDER than
	// `resolveFirstRunState`, which counts videos of any type: the landing
	// redirect and tab order keep the stricter rule, only the modal widens.
	// The dismissal flag alone is not enough (localStorage, so a new browser
	// presents as "never seen"), and nothing opens until both counts settle —
	// that also guarantees the footer label never flickers between states.
	//
	// `hasPublishedVideo()` is read here and written nowhere near here: this
	// component only mounts on the routes that carry the dashboard chrome, so
	// while it owned the write, a load that never touched those routes recorded
	// nothing and this gate reopened behind it. `useObserveFirstRunSignals`
	// writes it from every route now.
	const isOpen =
		! isDismissed &&
		isSettled &&
		( isWelcomeSession ||
			( ! hasPublishedVideo() &&
				videoPressCount === 0 &&
				! hasQueuedUpload &&
				! hasUploadedThisLoad ) );

	const dismiss = useCallback( () => {
		saveDismissal();
		setIsDismissed( true );
	}, [] );

	// The primary CTA opens the OS file picker directly — the same gesture as
	// the Library header's "Upload video" button — rather than parking the
	// user in front of another upload affordance. The modal stays up until a
	// selection is actually made, so cancelling the picker costs nothing.
	const openFilePicker = useCallback( () => {
		filePickerRef.current?.click();
	}, [] );

	// A selection ends the first run either way: the files go through the
	// same intake pipeline as the Library's own picker and DropZone (plan
	// gating, notices, queueing), and the user lands on the Library, where
	// the queued rows carry the live upload progress. A refused selection
	// lands there too — the refusal notice must be read over the Library,
	// not under this modal.
	const onFilesPicked = useCallback(
		( event: ChangeEvent< HTMLInputElement > ) => {
			const files = Array.from( event.target.files ?? [] );
			event.target.value = '';
			if ( files.length === 0 ) {
				return;
			}
			intakeFiles( files );
			dismiss();
			navigate( { href: '/' } );
		},
		[ intakeFiles, dismiss, navigate ]
	);

	// Lands on the Library pre-filtered to local videos, where the existing
	// bulk "Upload to VideoPress" action does the actual moving. The user
	// picks what migrates — this path never starts uploads on its own, and it
	// stays out of plan-limit logic (the library actions own that).
	const goToLocalLibrary = useCallback( () => {
		dismiss();
		navigate( { href: '/?type=local' } );
	}, [ dismiss, navigate ] );

	return (
		<Dialog.Root
			open={ isOpen }
			onOpenChange={ open => {
				if ( ! open ) {
					dismiss();
				}
			} }
		>
			{ /*
			 * `Dialog.Popup` deprioritizes the close icon when it picks initial
			 * focus, so without an override focus landed on the next focusable
			 * thing — the intro player's controls. That skipped the modal's
			 * accessible name and description entirely, and left Close behind
			 * the user. Focusing the popup itself makes the title and lede the
			 * first thing announced, and Close the first thing Tab reaches.
			 */ }
			<Dialog.Popup
				ref={ popupRef }
				initialFocus={ popupRef }
				size="medium"
				className="vp-onboarding-modal"
			>
				{ /*
				 * The band's background is the wireframe brand artwork — the
				 * idle state the Figma spec shows — with the intro film
				 * playing over it when one is configured. The close
				 * affordance sits over the band:
				 * this modal has no title bar, because its heading belongs
				 * with the copy below the video. Close renders BEFORE the
				 * video in the DOM (position: absolute keeps the visuals
				 * identical) so a keyboard user reaches it in one Tab instead
				 * of traversing the player's entire chrome.
				 */ }
				<div
					className="vp-onboarding-modal__media"
					style={
						{
							'--vp-intro-aspect': INTRO_VIDEO_ASPECT,
							...( wireframeUrl ? { '--vp-intro-artwork': `url("${ wireframeUrl }")` } : {} ),
						} as CSSProperties
					}
				>
					{ /*
					 * The band is the brand's deep forest green, so the design
					 * system is re-seeded with it: the close button and anything
					 * else rendered over the band resolve their colors from the
					 * derived dark scheme instead of hand-picked literals.
					 * ThemeProvider renders `display: contents`, so the close
					 * affordance still positions against the band itself.
					 */ }
					<BandTheme>
						<Dialog.CloseIcon
							className="vp-onboarding-modal__close"
							label={ __( 'Close', 'jetpack-videopress-pkg' ) }
						/>
						<IntroVideo />
					</BandTheme>
				</div>

				<Dialog.Content className="vp-onboarding-modal__body">
					{ /*
					 * Title and lede render at the design system's own dialog
					 * type scale. The Figma spec drew them larger (32px/15px),
					 * but Dialog.Title/Description expose no size variant, and
					 * overriding their internals is not a stable API — if the
					 * larger scale is wanted back, the ask is a variant prop on
					 * the components, not a local override.
					 */ }
					<Dialog.Title>
						{ __( 'Your Video. Your Player.', 'jetpack-videopress-pkg' ) }
					</Dialog.Title>
					<Dialog.Description className="vp-onboarding-modal__lede">
						{ __(
							'The same ad-free player every video on your site will use — your visitors stay on your site, and VideoPress handles the hosting and streaming. Upload one to see it live.',
							'jetpack-videopress-pkg'
						) }
					</Dialog.Description>

					{ /* list-style: none strips list semantics in Safari; the
					   explicit role restores "list, 3 items" for VoiceOver. */ }
					<ul className="vp-onboarding-modal__cards" role="list">
						{ VALUE_CARDS.map( card => (
							<li key={ card.title } className="vp-onboarding-modal__card">
								<span className="vp-onboarding-modal__card-icon" aria-hidden="true">
									{ card.icon }
								</span>
								<Text
									variant="heading-lg"
									render={ <span /> }
									className="vp-onboarding-modal__card-title"
								>
									{ card.title }
								</Text>
								<Text
									variant="body-md"
									render={ <span /> }
									className="vp-onboarding-modal__card-body"
								>
									{ card.body }
								</Text>
							</li>
						) ) }
					</ul>
				</Dialog.Content>

				<Dialog.Footer className="vp-onboarding-modal__footer">
					{ /*
					 * The secondary slot adapts to the site: when the media
					 * library holds videos VideoPress could host, it delivers
					 * on card 2's promise with the real count; on a genuinely
					 * empty site there is nothing to move, so it stays the
					 * humble docs link.
					 */ }
					{ localCount > 0 ? (
						<Button variant="outline" tone="neutral" onClick={ goToLocalLibrary }>
							{ sprintf(
								/* translators: %d: number of local videos in the media library. */
								_n(
									'Move %d video over',
									'Move %d videos over',
									localCount,
									'jetpack-videopress-pkg'
								),
								localCount
							) }
						</Button>
					) : (
						<LinkButton variant="minimal" tone="neutral" href={ LEARN_MORE_URL } openInNewTab>
							{ __( 'Learn more', 'jetpack-videopress-pkg' ) }
						</LinkButton>
					) }
					{ /*
					 * Neutral solid to match the spec's dark primary; the DS
					 * default for a primary action is brand tone, so this
					 * divergence is deliberate and owned by the spec.
					 */ }
					<input
						ref={ filePickerRef }
						type="file"
						accept={ videoFileAccept() }
						// The capped free tier can only ever host `limit` videos, so
						// multi-select there would only produce skipped-file notices;
						// paid and grandfathered-unlimited plans get bulk selection.
						multiple={ ! isFree || isUnlimited }
						style={ { display: 'none' } }
						onChange={ onFilesPicked }
					/>
					<Button variant="solid" tone="neutral" onClick={ openFilePicker }>
						{ __( 'Upload a video', 'jetpack-videopress-pkg' ) }
					</Button>
				</Dialog.Footer>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
