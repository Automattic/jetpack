import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, cloudUpload, share, video } from '@wordpress/icons';
import { Button, Dialog, LinkButton, Text } from '@wordpress/ui';
// The dismissal flag lives with the other first-run storage helpers so the
// redirect and the modal can't drift onto different keys.
import {
	hasSeenOnboarding,
	saveDismissal,
	useSettledFirstRunState,
} from '../../hooks/use-first-run-state';
import IntroVideo from './intro-video';
import './style.scss';
import type { ReactElement, ReactNode } from 'react';

const LEARN_MORE_URL = 'https://jetpack.com/videopress/';

type ValueCard = {
	icon: ReactNode;
	title: string;
	body: string;
};

/*
 * The three claims the product can keep on day one — deliberately not a
 * feature list, and deliberately not repeating what the video above shows.
 * Copy is verbatim from the Figma spec (VideoPress Revival, node 56-12912).
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
		body: __(
			'Videos already in your media library move to VideoPress in one click, no re-uploading.',
			'jetpack-videopress-pkg'
		),
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
 * value cards, and a Learn more / Upload a Video footer.
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
	const firstRunState = useSettledFirstRunState();

	// The dismissal flag alone is not enough: it lives in localStorage, so a
	// new browser or an established site would present as "never seen" and
	// greet a full library with a welcome modal. Wait for the count, then
	// only greet a genuine first run.
	const isOpen = ! isDismissed && firstRunState === 'first-run';

	const dismiss = useCallback( () => {
		saveDismissal();
		setIsDismissed( true );
	}, [] );

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
				 * with the copy below the video.
				 */ }
				<div className="vp-onboarding-modal__media">
					<IntroVideo />
					<Dialog.CloseIcon
						className="vp-onboarding-modal__close"
						label={ __( 'Close', 'jetpack-videopress-pkg' ) }
					/>
				</div>

				<Dialog.Content className="vp-onboarding-modal__body">
					<Dialog.Title className="vp-onboarding-modal__headline">
						{ __( 'Your Video. Your Player.', 'jetpack-videopress-pkg' ) }
					</Dialog.Title>
					<Dialog.Description className="vp-onboarding-modal__lede">
						{ __(
							"This is the same player every video on your site will use, hosted on your own site, not someone else's platform. Upload one to see it live.",
							'jetpack-videopress-pkg'
						) }
					</Dialog.Description>

					<ul className="vp-onboarding-modal__cards">
						{ VALUE_CARDS.map( card => (
							<li key={ card.title } className="vp-onboarding-modal__card">
								<span className="vp-onboarding-modal__card-icon" aria-hidden="true">
									{ card.icon }
								</span>
								<Text
									variant="body-md"
									render={ <span /> }
									className="vp-onboarding-modal__card-title"
								>
									{ card.title }
								</Text>
								<Text
									variant="body-sm"
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
					<LinkButton variant="minimal" tone="neutral" href={ LEARN_MORE_URL } openInNewTab>
						{ __( 'Learn more', 'jetpack-videopress-pkg' ) }
					</LinkButton>
					{ /*
					 * "Upload a Video" reveals the upload page already
					 * underneath — the first-run redirect put it there before
					 * this modal mounted — so it is honestly a dismissal.
					 * Neutral solid to match the spec's dark primary.
					 */ }
					<Button variant="solid" tone="neutral" onClick={ dismiss }>
						{ __( 'Upload a Video', 'jetpack-videopress-pkg' ) }
					</Button>
				</Dialog.Footer>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
