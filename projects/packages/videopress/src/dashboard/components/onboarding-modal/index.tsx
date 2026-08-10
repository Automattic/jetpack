import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, video, wordpress, link } from '@wordpress/icons';
import { Button, Dialog, Text } from '@wordpress/ui';
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

type ValuePoint = {
	icon: ReactNode;
	title: string;
	body: string;
};

/*
 * Three columns, not two tabs.
 *
 * The previous version made the same points behind a tab strip, which meant the
 * second one was never read and the panel jumped height between them. These are
 * the claims the product can actually keep on day one — deliberately not a
 * feature list, and deliberately not repeating what the video already shows.
 */
const VALUE_POINTS: ValuePoint[] = [
	{
		icon: <Icon icon={ video } size={ 24 } />,
		title: __( 'A player you own', 'jetpack-videopress-pkg' ),
		body: __( 'No ads, no logos, and nothing recommended afterwards.', 'jetpack-videopress-pkg' ),
	},
	{
		icon: <Icon icon={ wordpress } size={ 24 } />,
		title: __( 'Built into WordPress', 'jetpack-videopress-pkg' ),
		body: __(
			'Upload from the editor and manage videos in your media library.',
			'jetpack-videopress-pkg'
		),
	},
	{
		icon: <Icon icon={ link } size={ 24 } />,
		title: __( 'Share it anywhere', 'jetpack-videopress-pkg' ),
		body: __(
			'Every video gets a link and an embed that work off-site.',
			'jetpack-videopress-pkg'
		),
	},
];

/**
 * First-run VideoPress welcome modal.
 *
 * Built on `@wordpress/ui`'s `Dialog` rather than `@wordpress/components`'
 * `Modal`, matching the convention the rest of the modernized dashboard moved
 * to (see `video-details/select-frame-dialog.tsx`). `Dialog.Content` owns the
 * body padding and the scroll container, so neither is declared locally.
 *
 * The video band is a direct child of `Dialog.Popup`, deliberately outside
 * `Dialog.Content`: it is full-bleed chrome rather than body copy, and running
 * it through the padded scroll region would inset it.
 *
 * @return The onboarding modal, or null when it should not be shown.
 */
export default function OnboardingModal(): ReactElement | null {
	const [ isDismissed, setIsDismissed ] = useState( () => hasSeenOnboarding() );
	const firstRunState = useSettledFirstRunState();

	// The dismissal flag alone is not enough to decide this. It lives in
	// localStorage, so a new browser, a cleared profile, or a site that had
	// videos before this shipped all present as "never seen" — and an
	// established user with a full library would get the welcome modal over
	// their dashboard. Wait for the count, then only greet a genuine first run.
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
			<Dialog.Popup size="large" className="vp-onboarding-modal">
				<div className="vp-onboarding-modal__media">
					<IntroVideo />
					{ /*
					 * The close affordance sits over the video rather than in a
					 * `Dialog.Header`: this modal has no title bar, because its
					 * heading belongs under the video with the rest of the copy.
					 */ }
					<Dialog.CloseIcon
						className="vp-onboarding-modal__close"
						label={ __( 'Close', 'jetpack-videopress-pkg' ) }
					/>
				</div>

				<Dialog.Content className="vp-onboarding-modal__body">
					<Dialog.Title className="vp-onboarding-modal__headline">
						{ __( 'Video that works for you, not the algorithm', 'jetpack-videopress-pkg' ) }
					</Dialog.Title>
					<Dialog.Description className="vp-onboarding-modal__lede">
						{ __(
							'Host your videos on your own site, in a player you control. Upload one and see how it looks.',
							'jetpack-videopress-pkg'
						) }
					</Dialog.Description>

					<ul className="vp-onboarding-modal__points">
						{ VALUE_POINTS.map( point => (
							<li key={ point.title } className="vp-onboarding-modal__point">
								<span className="vp-onboarding-modal__point-icon" aria-hidden="true">
									{ point.icon }
								</span>
								<Text
									variant="body-md"
									render={ <span /> }
									className="vp-onboarding-modal__point-title"
								>
									{ point.title }
								</Text>
								<Text
									variant="body-sm"
									render={ <span /> }
									className="vp-onboarding-modal__point-body"
								>
									{ point.body }
								</Text>
							</li>
						) ) }
					</ul>
				</Dialog.Content>

				<Dialog.Footer className="vp-onboarding-modal__footer">
					{ /*
					 * "Get started" reveals the upload page already underneath — the
					 * first-run redirect put it there before this modal mounted. It is
					 * honestly a dismissal, so it does not pretend to navigate.
					 */ }
					<Button variant="solid" className="vp-onboarding-modal__primary" onClick={ dismiss }>
						{ __( 'Get started', 'jetpack-videopress-pkg' ) }
					</Button>
				</Dialog.Footer>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
