// Locked-preview UX for Episodes + Stats on free plans. Replaces the plain
// upsell card with a blurred-sample-data preview behind a centered upgrade
// overlay, so the user can see roughly what Premium unlocks without revealing
// any real data.

import { getProductCheckoutUrl } from '@automattic/jetpack-components';
import { getSiteData } from '@automattic/jetpack-script-data';
import { Button } from '@wordpress/components';
import { useCallback, useId } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import EpisodesPreview from './episodes-preview';
import StatsPreview from './stats-preview';
import './style.scss';
import type { KeyboardEvent, ReactNode } from 'react';

export type LockedPreviewVariant = 'episodes' | 'stats';

interface LockedPreviewProps {
	variant: LockedPreviewVariant;
}

const PREVIEW_BY_VARIANT: Record< LockedPreviewVariant, () => ReactNode > = {
	episodes: () => <EpisodesPreview />,
	stats: () => <StatsPreview />,
};

// Hoisted so terser can't fold them into __(cond?'a':'b') — the i18n-check
// validator rejects that shape.
const EPISODES_OVERLAY_TITLE = __( 'Episode dashboard included with Premium', 'jetpack-podcast' );
const STATS_OVERLAY_TITLE = __( 'Episode stats included with Premium', 'jetpack-podcast' );
const EPISODES_OVERLAY_DESCRIPTION = __(
	'Upgrade to Premium to see every episode, track plays and durations, and manage your catalog from one place.',
	'jetpack-podcast'
);
const STATS_OVERLAY_DESCRIPTION = __(
	'Upgrade to Premium to see downloads, top episodes, and listener apps over time.',
	'jetpack-podcast'
);

const OVERLAY_TITLE_BY_VARIANT: Record< LockedPreviewVariant, string > = {
	episodes: EPISODES_OVERLAY_TITLE,
	stats: STATS_OVERLAY_TITLE,
};

const OVERLAY_DESCRIPTION_BY_VARIANT: Record< LockedPreviewVariant, string > = {
	episodes: EPISODES_OVERLAY_DESCRIPTION,
	stats: STATS_OVERLAY_DESCRIPTION,
};

const CTA_LABEL = __( 'Upgrade to Premium', 'jetpack-podcast' );

const LockedPreview = ( { variant }: LockedPreviewProps ) => {
	const siteSuffix = getSiteData()?.suffix ?? '';
	const checkoutUrl = siteSuffix
		? getProductCheckoutUrl( 'premium', siteSuffix, window.location.href, true )
		: 'https://wordpress.com/pricing';

	const titleId = useId();

	// Escape blurs the CTA so the user can tab out into the dashboard tab list
	// instead of staying parked on this control. The wrapper is keyboard-active
	// even though only the CTA is focusable, so escape from anywhere inside the
	// preview region still does the right thing.
	const handleKeyDown = useCallback( ( event: KeyboardEvent< HTMLDivElement > ) => {
		if ( event.key !== 'Escape' ) {
			return;
		}
		const active = document.activeElement;
		if ( active instanceof HTMLElement ) {
			active.blur();
		}
	}, [] );

	const overlayTitle = OVERLAY_TITLE_BY_VARIANT[ variant ];
	const overlayDescription = OVERLAY_DESCRIPTION_BY_VARIANT[ variant ];

	return (
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions
		<div
			className="podcast-locked-preview"
			role="region"
			aria-labelledby={ titleId }
			onKeyDown={ handleKeyDown }
		>
			{ /* Sample data is purely visual: no focusable elements, no
				 network calls, no real values. `aria-hidden` keeps it off the
				 a11y tree; `pointer-events: none` (in the SCSS) keeps it
				 unclickable. */ }
			<div className="podcast-locked-preview__sample" aria-hidden="true">
				{ PREVIEW_BY_VARIANT[ variant ]() }
			</div>

			<div className="podcast-locked-preview__overlay">
				<div className="podcast-locked-preview__card">
					<h2 id={ titleId } className="podcast-locked-preview__title">
						{ overlayTitle }
					</h2>
					<p className="podcast-locked-preview__description">{ overlayDescription }</p>
					{ /* autoFocus puts the keyboard / screen reader user on the
						 upgrade affordance on mount instead of leaving them on
						 the (hidden) placeholder data. */ }
					<Button
						variant="primary"
						href={ checkoutUrl }
						className="podcast-locked-preview__cta"
						// eslint-disable-next-line jsx-a11y/no-autofocus
						autoFocus
					>
						{ CTA_LABEL }
					</Button>
				</div>
			</div>
		</div>
	);
};

export default LockedPreview;
