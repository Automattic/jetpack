import { JetpackLogo } from '@automattic/jetpack-components';
import { getScriptData } from '@automattic/jetpack-script-data';
import { Modal } from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Tabs, Text } from '@wordpress/ui';
import './style.scss';
import type { ReactElement } from 'react';

type OnboardingTab = 'player' | 'wordpress';
type OnboardingTabImageFile = 'videopress-audience-2x.jpeg' | 'videopress-quality-2x.jpeg';
// The artwork panel's cover art, exported at the panel's own size (264x341).
type OnboardingImageFile = OnboardingTabImageFile | 'videopress-cover-2x.png';

const COVER_IMAGE: OnboardingImageFile = 'videopress-cover-2x.png';

// Each source bitmap is cropped to a different window, so the preview card
// carries a per-image modifier that supplies the crop numbers. See the
// `--vp-crop-*` blocks in style.scss for how each window was derived.
type OnboardingImageCrop = 'audience' | 'quality';

type OnboardingTabContent = {
	value: OnboardingTab;
	label: string;
	headline: string;
	body: string;
	image: OnboardingTabImageFile;
	imageCrop: OnboardingImageCrop;
	imageAlt: string;
};

const STORAGE_KEY_PREFIX = 'jetpack-videopress-onboarding-seen';

const ONBOARDING_TABS: OnboardingTabContent[] = [
	{
		value: 'player',
		label: __( 'Your player', 'jetpack-videopress-pkg' ),
		headline: __( 'Your videos. On your site.', 'jetpack-videopress-pkg' ),
		body: __(
			'Our immersive and clean player is designed to put your content in the spotlight. No ads, no logos — only your best ideas on the screen, with colors you can match to your brand.',
			'jetpack-videopress-pkg'
		),
		image: 'videopress-audience-2x.jpeg',
		imageCrop: 'audience',
		imageAlt: __(
			'VideoPress player showing a video with playback controls and creator details.',
			'jetpack-videopress-pkg'
		),
	},
	{
		value: 'wordpress',
		label: __( 'Built for WordPress', 'jetpack-videopress-pkg' ),
		headline: __( 'Drag, drop, done.', 'jetpack-videopress-pkg' ),
		body: __(
			'Add videos straight into WordPress and manage them in your media library. Search and filter your whole library, and edit titles and descriptions from one place.',
			'jetpack-videopress-pkg'
		),
		image: 'videopress-quality-2x.jpeg',
		imageCrop: 'quality',
		imageAlt: __(
			'A VideoPress video embedded full-width in a page, badged with the Jetpack mark.',
			'jetpack-videopress-pkg'
		),
	},
];

const DEFAULT_TAB: OnboardingTab = 'player';

/**
 * Build a per-site/per-user localStorage key for the first-run dismissal.
 *
 * @return Storage key scoped to the current dashboard user.
 */
function getStorageKey(): string {
	const data = getScriptData();
	const blogId = data?.site?.wpcom?.blog_id;
	const scope = typeof blogId === 'number' && blogId > 0 ? blogId : data?.site?.host ?? 'site';
	const userId = data?.user?.current_user?.id ?? 'user';

	return `${ STORAGE_KEY_PREFIX }-${ scope }-${ userId }`;
}

/**
 * Read the saved dismissal flag.
 *
 * @return True when the user already dismissed the modal.
 */
export function hasSeenOnboarding(): boolean {
	if ( typeof window === 'undefined' ) {
		return true;
	}

	try {
		return window.localStorage.getItem( getStorageKey() ) === '1';
	} catch {
		return false;
	}
}

/**
 * Save the dismissal flag, ignoring unavailable storage.
 */
function saveDismissal(): void {
	if ( typeof window === 'undefined' ) {
		return;
	}

	try {
		window.localStorage.setItem( getStorageKey(), '1' );
	} catch {
		// Storage can be unavailable in private browsing or due to quota; the
		// modal still dismisses for the current session through component state.
	}
}

/**
 * Build the public URL for an onboarding image.
 *
 * @param file - Image filename.
 * @return Public image URL, or undefined when initial state is unavailable.
 */
function getOnboardingImageUrl( file: OnboardingImageFile ): string | undefined {
	const buildUrl =
		typeof JPVIDEOPRESS_INITIAL_STATE !== 'undefined'
			? JPVIDEOPRESS_INITIAL_STATE?.assets?.buildUrl
			: undefined;

	if ( ! buildUrl ) {
		return undefined;
	}

	return new URL( `dashboard/onboarding-modal/images/${ file }`, buildUrl ).href;
}

/**
 * Product preview shown on the onboarding modal.
 *
 * @param props     - Component props.
 * @param props.tab - Active onboarding tab.
 * @return VideoPress product illustration.
 */
function ProductPreview( { tab }: { tab: OnboardingTabContent } ): ReactElement {
	const imageUrl = getOnboardingImageUrl( tab.image );

	return (
		<div
			className={ `vp-onboarding-modal__preview vp-onboarding-modal__preview--${ tab.imageCrop }` }
		>
			{ /*
			 * These illustrations communicate product UI details beyond the adjacent
			 * copy, so keep the alt text descriptive instead of empty.
			 */ }
			<img className="vp-onboarding-modal__image" src={ imageUrl } alt={ tab.imageAlt } />
		</div>
	);
}

/**
 * First-run VideoPress dashboard onboarding modal.
 *
 * @return The onboarding modal, or null after dismissal.
 */
export default function OnboardingModal(): ReactElement | null {
	const [ isOpen, setIsOpen ] = useState( () => ! hasSeenOnboarding() );
	const [ activeTab, setActiveTab ] = useState< OnboardingTab >( DEFAULT_TAB );

	const dismiss = useCallback( () => {
		saveDismissal();
		setIsOpen( false );
	}, [] );

	const activeTabContent =
		ONBOARDING_TABS.find( tab => tab.value === activeTab ) ?? ONBOARDING_TABS[ 0 ];

	// Rendering `null` from a ternary rather than returning early keeps every
	// hook above unconditional and avoids an early-return lint failure.
	return isOpen ? (
		<Modal
			className="vp-onboarding-modal"
			contentLabel={ __( 'Welcome to VideoPress', 'jetpack-videopress-pkg' ) }
			onRequestClose={ dismiss }
			__experimentalHideHeader
		>
			<Button
				variant="unstyled"
				size="compact"
				className="vp-onboarding-modal__close"
				aria-label={ __( 'Close', 'jetpack-videopress-pkg' ) }
				onClick={ dismiss }
			>
				×
			</Button>
			<div className="vp-onboarding-modal__content">
				<div className="vp-onboarding-modal__copy">
					{ /*
					 * The same brand lockup the surrounding wp-admin chrome uses: the
					 * dashboard's `AdminPage` masthead passes
					 * `<JetpackLogo showText={ false } height={ 20 } />` as the admin-ui
					 * `Page` header visual and the product name as the header title, and
					 * the wp-admin sidebar item is the same Jetpack mark (white, from
					 * `Logo::get_base64_logo()`). The row is decorative here — the modal
					 * is already labelled "Welcome to VideoPress" — so it is hidden from
					 * assistive tech rather than announced a second time.
					 */ }
					<div className="vp-onboarding-modal__brand" aria-hidden="true">
						<JetpackLogo
							showText={ false }
							height={ 20 }
							className="vp-onboarding-modal__brand-logo"
						/>
						<Text
							variant="heading-lg"
							render={ <span /> }
							className="vp-onboarding-modal__brand-name"
						>
							{ 'VideoPress' /* product name; not translated */ }
						</Text>
					</div>
					<Tabs.Root
						className="vp-onboarding-modal__tabs"
						value={ activeTab }
						onValueChange={ value => setActiveTab( value as OnboardingTab ) }
					>
						<Tabs.List className="vp-onboarding-modal__tab-list" variant="minimal">
							{ ONBOARDING_TABS.map( tab => (
								<Tabs.Tab key={ tab.value } value={ tab.value }>
									{ tab.label }
								</Tabs.Tab>
							) ) }
						</Tabs.List>
						{ ONBOARDING_TABS.map( tab => (
							<Tabs.Panel
								key={ tab.value }
								value={ tab.value }
								className="vp-onboarding-modal__tab-panel"
							>
								<Text
									variant="heading-xl"
									render={ <h2 /> }
									className="vp-onboarding-modal__headline"
								>
									{ tab.headline }
								</Text>
								<Text variant="body-md" render={ <p /> } className="vp-onboarding-modal__body">
									{ tab.body }
								</Text>
							</Tabs.Panel>
						) ) }
					</Tabs.Root>
					<Button variant="solid" className="vp-onboarding-modal__primary" onClick={ dismiss }>
						{ __( 'Get started', 'jetpack-videopress-pkg' ) }
					</Button>
				</div>
				<div className="vp-onboarding-modal__visual">
					{ /*
					 * The panel's cover art. Purely a background — the panel's meaning
					 * is carried by the card in front of it and by the copy — so it is
					 * decorative and stays out of the accessibility tree.
					 */ }
					<img
						className="vp-onboarding-modal__cover"
						src={ getOnboardingImageUrl( COVER_IMAGE ) }
						alt=""
						aria-hidden="true"
					/>
					<ProductPreview tab={ activeTabContent } />
				</div>
			</div>
		</Modal>
	) : null;
}
