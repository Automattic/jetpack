import { useCallback, useEffect, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Icon, cloudUpload, share, video } from '@wordpress/icons';
import { useNavigate, useSearch } from '@wordpress/route';
import { Button, Dialog, LinkButton, Text } from '@wordpress/ui';
// The dismissal flag lives with the other first-run storage helpers so the
// redirect and the modal can't drift onto different keys.
import {
	clearDismissal,
	hasPublishedVideo,
	hasSeenOnboarding,
	saveDismissal,
} from '../../hooks/use-first-run-state';
import { useOnboardingCounts } from '../../hooks/use-onboarding-counts';
import IntroVideo, { INTRO_VIDEO_ASPECT } from './intro-video';
import './style.scss';
import type { CSSProperties, ReactElement, ReactNode } from 'react';

const LEARN_MORE_URL = 'https://jetpack.com/videopress/';

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
 * a deep-green video band up top — the intro film playing in the player the
 * modal is selling — over a white content area with the headline, three
 * value cards, and a Learn more / Upload a video footer.
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
	const navigate = useNavigate();
	const search = useSearch( { strict: false } ) as Record< string, unknown >;

	// `welcome=1` is the review affordance: it reopens the modal regardless of
	// the dismissal flag or the library state, and forgets the stored
	// dismissal so plain loads behave fresh again afterwards. Without it,
	// seeing the modal twice means hand-clearing localStorage. Checked in the
	// router's search AND the raw wp-admin query string — on a fresh page
	// load the router only parses search it finds inside the `p` path param,
	// and a plain `&welcome=1` on admin.php is the easier URL to hand around.
	const isPreview =
		search?.welcome === '1' ||
		( typeof window !== 'undefined' &&
			new URLSearchParams( window.location.search ).get( 'welcome' ) === '1' );

	useEffect( () => {
		if ( isPreview ) {
			clearDismissal();
			setIsDismissed( false );
		}
	}, [ isPreview ] );

	// The modal greets anyone who has not used VideoPress yet — including
	// sites whose media library is full of local videos, which is exactly the
	// audience for the migration pitch below. This is deliberately WIDER than
	// `resolveFirstRunState`, which counts videos of any type: the landing
	// redirect and tab order keep the stricter rule, only the modal widens.
	// The dismissal flag alone is not enough (localStorage, so a new browser
	// presents as "never seen"), and nothing opens until both counts settle —
	// that also guarantees the footer label never flickers between states.
	const isOpen =
		! isDismissed &&
		isSettled &&
		( isPreview || ( ! hasPublishedVideo() && videoPressCount === 0 ) );

	const dismiss = useCallback( () => {
		saveDismissal();
		setIsDismissed( true );
	}, [] );

	// The primary CTA has to NAVIGATE, not just reveal: with the widened
	// gate, the modal can open over the Library or Home routes, where nothing
	// upload-shaped is underneath. On a true first run this is a no-op hop to
	// the page already showing.
	const goToUpload = useCallback( () => {
		dismiss();
		navigate( { href: '/upload' } );
	}, [ dismiss, navigate ] );

	// Lands on the Library pre-filtered to local videos, where the existing
	// bulk "Upload to VideoPress" action does the actual moving. The user
	// picks what migrates — the modal never starts uploads on its own, and it
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
			<Dialog.Popup size="medium" className="vp-onboarding-modal">
				{ /*
				 * The band's background is the wireframe brand artwork — the
				 * idle state the Figma spec shows — with the intro film
				 * playing over it. The close affordance sits over the band:
				 * this modal has no title bar, because its heading belongs
				 * with the copy below the video. Close renders BEFORE the
				 * video in the DOM (position: absolute keeps the visuals
				 * identical) so a keyboard user reaches it in one Tab instead
				 * of traversing the player's entire chrome.
				 */ }
				<div
					className="vp-onboarding-modal__media"
					style={ { '--vp-intro-aspect': INTRO_VIDEO_ASPECT } as CSSProperties }
				>
					<Dialog.CloseIcon
						className="vp-onboarding-modal__close"
						label={ __( 'Close', 'jetpack-videopress-pkg' ) }
					/>
					<IntroVideo />
				</div>

				<Dialog.Content className="vp-onboarding-modal__body">
					{ /*
					 * Dialog.Title/Description pin their own internal type
					 * variants (20px/13px) and expose no variant prop, so the
					 * spec's 32px headline and 15px lede are applied in the
					 * stylesheet with the tokens `heading-2xl` and `body-lg`
					 * resolve to. See style.scss.
					 */ }
					<Dialog.Title className="vp-onboarding-modal__headline">
						{ __( 'Your Video. Your Player.', 'jetpack-videopress-pkg' ) }
					</Dialog.Title>
					<Dialog.Description className="vp-onboarding-modal__lede">
						{ __(
							"This is the same player every video on your site will use, hosted on your own site, not someone else's platform. Upload one to see it live.",
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
					<Button variant="solid" tone="neutral" onClick={ goToUpload }>
						{ __( 'Upload a video', 'jetpack-videopress-pkg' ) }
					</Button>
				</Dialog.Footer>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
