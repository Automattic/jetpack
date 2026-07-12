import { Button, Notice } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect } from 'react';
import useSeoOptIn from '../../data/use-seo-opt-in';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import useAnalytics from '../../hooks/use-analytics';

// Pre-resolved so the production minifier can't fold the adjacent `cond ? __(A) : __(B)`
// into `__(cond ? A : B)`, which breaks i18n static extraction (i18n-check-webpack-plugin).
// See feedback_i18n_ternary_minifier_fold.
const enablingLabel = __( 'Enabling…', 'jetpack-my-jetpack' );
const tryItLabel = __( 'Try the new SEO experience', 'jetpack-my-jetpack' );

/**
 * Promotional notice inviting an existing self-hosted install to try the new Jetpack SEO dashboard
 * (JETPACK-1700). The primary CTA opts the site in via `/jetpack/v4/seo/opt-in` and, on success,
 * navigates to the SEO dashboard URL the endpoint returns. Whether the notice renders is decided
 * server-side and bootstrapped onto `seoOptIn.showCard`.
 *
 * @return The rendered notice, or `null` when the site isn't eligible.
 */
export default function SeoOptInCard() {
	const { showCard } = getMyJetpackWindowInitialState( 'seoOptIn' );
	const { recordEvent } = useAnalytics();
	const { optIn, isPending } = useSeoOptIn();

	useEffect( () => {
		if ( showCard ) {
			recordEvent( 'jetpack_myjetpack_seo_opt_in_card_view', {} );
		}
	}, [ showCard, recordEvent ] );

	const handleClick = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_seo_opt_in_card_click', {} );
		optIn();
	}, [ optIn, recordEvent ] );

	if ( ! showCard ) {
		return null;
	}

	const ctaLabel = isPending ? enablingLabel : tryItLabel;

	const actions = [
		<Button
			key="seo-opt-in"
			variant="primary"
			onClick={ handleClick }
			isLoading={ isPending }
			disabled={ isPending }
		>
			{ ctaLabel }
		</Button>,
	];

	return (
		<Notice
			level="info"
			hideCloseButton={ true }
			title={ __( 'A fresh way to manage your SEO', 'jetpack-my-jetpack' ) }
			actions={ actions }
		>
			{ __(
				'Jetpack SEO now has a dedicated dashboard to manage sitemaps, search-engine visibility, social previews, and site verification — all in one place. Switch over whenever you like; your existing settings come with you.',
				'jetpack-my-jetpack'
			) }
		</Notice>
	);
}
