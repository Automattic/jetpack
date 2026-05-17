// Locked-preview UX for Episodes + Stats on free plans. Replaces the plain
// upsell card with a blurred-sample-data preview behind a centered upgrade
// overlay, so the user can see roughly what Premium unlocks without revealing
// any real data.

import { getProductCheckoutUrl } from '@automattic/jetpack-components';
import { getSiteData } from '@automattic/jetpack-script-data';
import { Button } from '@wordpress/components';
import { useId } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import EpisodesPreview from './episodes-preview';
import StatsPreview from './stats-preview';
import './style.scss';
import type { ReactNode } from 'react';

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
	'Upgrade to Premium to manage your podcast catalog from a unified dashboard.',
	'jetpack-podcast'
);
const STATS_OVERLAY_DESCRIPTION = __(
	'Upgrade to Premium to see downloads by episode, app, and country.',
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
	const returnUrl = window.location.href;
	const checkoutUrl = ( () => {
		if ( ! siteSuffix ) {
			return 'https://wordpress.com/pricing';
		}
		// `getProductCheckoutUrl` sets `redirect_to` for the success path; the
		// cart's close button reads `cancel_to`, so both need pointing back to
		// the dashboard for the user to land where they started.
		const url = new URL( getProductCheckoutUrl( 'premium', siteSuffix, returnUrl, true ) );
		url.searchParams.set( 'cancel_to', returnUrl );
		return url.toString();
	} )();

	const titleId = useId();

	const overlayTitle = OVERLAY_TITLE_BY_VARIANT[ variant ];
	const overlayDescription = OVERLAY_DESCRIPTION_BY_VARIANT[ variant ];

	return (
		<div className="podcast-locked-preview" role="region" aria-labelledby={ titleId }>
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
