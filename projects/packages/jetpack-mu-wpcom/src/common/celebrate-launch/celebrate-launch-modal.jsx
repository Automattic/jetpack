import CelebrationModal from '@automattic/site-launch-modals/celebration-modal';
import { useEffect } from 'react';
import { wpcomTrackEvent } from '../tracks';

import './celebrate-launch-modal.scss';

/**
 * CelebrateLaunchModal component
 *
 * Thin container around the shared `site-launch-modals` package's celebration
 * modal. It keeps the WordPress.com-specific concerns the package intentionally
 * leaves to the host: Tracks analytics and the upsell destination.
 *
 * @param {object}   props                 - Props.
 * @param {Function} props.onRequestClose  - Callback on modal close.
 * @param {object}   [props.sitePlan]      - The site plan (optional).
 * @param {string}   props.siteDomain      - The site domain.
 * @param {string}   props.siteUrl         - The site URL.
 * @param {boolean}  props.hasCustomDomain - Whether the site has a custom domain.
 *
 * @return {import('react').JSX.Element} The CelebrateLaunchModal component.
 */
export default function CelebrateLaunchModal( {
	onRequestClose,
	sitePlan,
	siteDomain,
	siteUrl,
	hasCustomDomain,
} ) {
	const isPaidPlan = !! sitePlan;
	const isBilledMonthly = !! sitePlan?.product_slug?.includes( 'monthly' );

	useEffect( () => {
		wpcomTrackEvent( 'calypso_launchpad_celebration_modal_view', {
			product_slug: sitePlan?.product_slug,
		} );
	}, [ sitePlan?.product_slug ] );

	return (
		<CelebrationModal
			siteDomain={ siteDomain }
			siteUrl={ siteUrl }
			hasCustomDomain={ hasCustomDomain }
			isPaidPlan={ isPaidPlan }
			isBilledMonthly={ isBilledMonthly }
			upsellHref={ `https://wordpress.com/domains/add/${ siteDomain }` }
			onUpsellClick={ () =>
				wpcomTrackEvent( 'calypso_launchpad_celebration_modal_upsell_clicked', {
					product_slug: sitePlan?.product_slug,
				} )
			}
			onClose={ onRequestClose }
		/>
	);
}
