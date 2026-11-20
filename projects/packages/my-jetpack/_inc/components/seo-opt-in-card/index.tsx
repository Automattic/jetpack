import { Button } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
import { useCallback, useEffect } from 'react';
import useSeoOptIn from '../../data/use-seo-opt-in';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import useAnalytics from '../../hooks/use-analytics';
import type { SeoOptInSurface } from '../../data/use-seo-opt-in';

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
 * @param props         - Component props.
 * @param props.surface - Where the card shows, recorded with its events.
 * @return The rendered notice, or `null` when the site isn't eligible.
 */
export default function SeoOptInCard( { surface = 'overview' }: { surface?: SeoOptInSurface } ) {
	const { showCard } = getMyJetpackWindowInitialState( 'seoOptIn' );
	const { recordEvent } = useAnalytics();
	const { optIn, isPending } = useSeoOptIn( surface );

	useEffect( () => {
		if ( showCard ) {
			recordEvent( 'jetpack_myjetpack_seo_opt_in_card_view', { surface } );
		}
	}, [ showCard, recordEvent, surface ] );

	const handleClick = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_seo_opt_in_card_click', { surface } );
		optIn();
	}, [ optIn, recordEvent, surface ] );

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
		<Notice.Root intent="info">
			<Notice.Title>{ __( 'A fresh way to manage your SEO', 'jetpack-my-jetpack' ) }</Notice.Title>
			<Notice.Description>
				{ __(
					'Jetpack SEO now has a dedicated dashboard to manage sitemaps, search-engine visibility, social previews, and site verification — all in one place. Switching also enables Jetpack SEO tools if they are off. Your existing settings are kept.',
					'jetpack-my-jetpack'
				) }
			</Notice.Description>
			<Notice.Actions>{ actions }</Notice.Actions>
		</Notice.Root>
	);
}
