import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { starFilled } from '@wordpress/icons';
import { Link, ButtonLink, Text } from '@wordpress/ui';
import { useCallback } from 'react';
import { isOfflineFeatures } from '../../../data/utils/offline-features';
import useAnalytics from '../../../hooks/use-analytics';
import { getFeaturePricingHref } from '../utils';
import { FeatureHighlights } from './feature-highlights';
import { isPlanExpired } from './feature-state';
import { useFeaturesTracking } from './features-tracking-context';
import { getModuleAvailability } from './module-availability';
import styles from './styles.module.scss';
import type { FeatureState } from './feature-state';

type PlanLinkProps = {
	plan: { slug: string; name: string; owned?: boolean };
	state: FeatureState;
};

/**
 * A plan name, linked to its pricing page unless the site has the plan or offline Features,
 * which serves no purchase route, is open.
 *
 * @param {PlanLinkProps} props       - The component props.
 * @param {object}        props.plan  - The plan's slug, display name, and whether the site has it.
 * @param {FeatureState}  props.state - Live state for the feature whose details link here.
 * @return The rendered component.
 */
function PlanLink( { plan, state }: PlanLinkProps ) {
	const tracking = useFeaturesTracking();
	const onClick = useCallback(
		() => tracking?.trackPlanClick( state, plan.slug ),
		[ plan.slug, state, tracking ]
	);

	if ( isOfflineFeatures() || plan.owned ) {
		return <>{ plan.name }</>;
	}

	return (
		<Link
			href={ getFeaturePricingHref( `/add-${ plan.slug }`, state.feature.slug ) }
			onClick={ onClick }
		>
			{ plan.name }
		</Link>
	);
}

/**
 * The sentence naming the plans that include a feature, with a `<planN />` per plan.
 *
 * @param count - How many plans there are.
 * @return The sentence.
 */
function getIncludedIn( count: number ): string {
	if ( count === 1 ) {
		return __( 'Included in <plan0 />', 'jetpack-my-jetpack' );
	}

	if ( count === 2 ) {
		return __( 'Included in <plan0 /> and <plan1 />', 'jetpack-my-jetpack' );
	}

	return __( 'Included in <plan0 />, <plan1 /> and <plan2 />', 'jetpack-my-jetpack' );
}

/**
 * Whether host policy or multisite support blocks a purchase route.
 *
 * @param state - Live state for the feature.
 * @return True when buying cannot remove the limitation.
 */
function isPurchaseBlocked( state: FeatureState ): boolean {
	return (
		( state.control.kind === 'module' &&
			( state.control.module.override === 'inactive' ||
				getModuleAvailability( state.control.module ).isMultisiteBlocked ) ) ||
		( ( state.control.kind === 'plugin' || state.control.kind === 'none' ) &&
			state.control.override === 'inactive' )
	);
}

/**
 * Where Upgrade sells a feature: an expired plan's purchase page, a host's own plans, else a My
 * Jetpack route; null when nothing is sold.
 *
 * @param state - Live state for the feature.
 * @return The address, what to track for it, and whether it renews.
 */
function getUpgradeLink(
	state: FeatureState
): { href: string; target: string; renew?: boolean } | null {
	const { feature } = state;

	if ( isPurchaseBlocked( state ) ) {
		return null;
	}

	// Ahead of a host's plans: a WordPress.com plan expires too, and it is the one to renew.
	const renewUrl = isPlanExpired( state ) ? state.product?.managePaidPlanPurchaseUrl : '';
	if ( renewUrl ) {
		return { href: renewUrl, target: 'renew', renew: true };
	}

	// Tracked as `host`: a host's URL can carry the site's address.
	if ( feature.upgrade?.url ) {
		return { href: feature.upgrade.url, target: 'host' };
	}

	// Empty when the site already pays for the feature; the catalog decides that, not the client.
	const path = feature.upgrade?.path;

	return path ? { href: getFeaturePricingHref( path, feature.slug ), target: path } : null;
}

type UpgradeButtonProps = {
	state: FeatureState;
};

/**
 * The button that opens the pricing page for a feature, kept in the header so it never scrolls away.
 *
 * @param {UpgradeButtonProps} props       - The component props.
 * @param {FeatureState}       props.state - Live state for the feature.
 * @return The rendered component, or null when there is nothing to sell.
 */
export function UpgradeButton( props: UpgradeButtonProps ) {
	if ( isOfflineFeatures() ) {
		return null;
	}
	return <TrackedUpgradeButton { ...props } />;
}

/**
 * Render an upgrade with connected analytics.
 *
 * @param props       - The props.
 * @param props.state - The feature state.
 * @return The upgrade button.
 */
function TrackedUpgradeButton( { state }: UpgradeButtonProps ) {
	const { feature } = state;
	const { recordEvent } = useAnalytics();
	const link = getUpgradeLink( state );
	const target = link?.target;
	const onUpgrade = useCallback(
		() =>
			recordEvent( 'jetpack_myjetpack_features_upgrade_click', {
				feature: feature.slug,
				target,
			} ),
		[ feature.slug, recordEvent, target ]
	);

	if ( ! link ) {
		return null;
	}

	return (
		<ButtonLink
			href={ link.href }
			onClick={ onUpgrade }
			variant="outline"
			size="compact"
			// Upselling is not what the modal is open to reach, so focus skips it.
			data-feature-upgrade
			aria-label={
				link.renew
					? sprintf(
							/* translators: %s is a feature name, such as "Backup". */
							__( 'Renew the plan for %s', 'jetpack-my-jetpack' ),
							feature.name
						)
					: sprintf(
							/* translators: %s is a product name, such as "Jetpack Akismet Anti-spam". */
							__( 'Upgrade to %s', 'jetpack-my-jetpack' ),
							feature.upgrade?.name || feature.name
						)
			}
		>
			{ link.renew ? __( 'Renew', 'jetpack-my-jetpack' ) : __( 'Upgrade', 'jetpack-my-jetpack' ) }
		</ButtonLink>
	);
}

type FeaturePaidProps = {
	state: FeatureState;
};

/**
 * What a paid plan adds, and which plans include it.
 *
 * @param {FeaturePaidProps} props       - The component props.
 * @param {FeatureState}     props.state - Live state for the feature.
 * @return The rendered component.
 */
export function FeaturePaid( { state }: FeaturePaidProps ) {
	const { feature } = state;
	const plans = feature.plans ?? [];
	const highlights = feature.paid_highlights ?? [];
	// A host's own upgrade sells its plans, and a renewal resumes one, not the Jetpack ones listed here.
	const showPlans =
		! isPurchaseBlocked( state ) &&
		! feature.upgrade?.url &&
		! isPlanExpired( state ) &&
		plans.length > 0;

	if ( ! highlights.length && ! showPlans ) {
		return null;
	}

	return (
		<section className={ styles[ 'detail-section' ] }>
			<Text variant="heading-sm" render={ <h3 /> }>
				{ __( 'With a paid plan', 'jetpack-my-jetpack' ) }
			</Text>

			{ highlights.length ? <FeatureHighlights items={ highlights } icon={ starFilled } /> : null }

			{ showPlans ? (
				<Text variant="body-sm" className={ styles[ 'paid-routes' ] }>
					{ createInterpolateElement(
						getIncludedIn( plans.length ),
						Object.fromEntries(
							plans.map( ( plan, index ) => [
								`plan${ index }`,
								<PlanLink key={ plan.slug } plan={ plan } state={ state } />,
							] )
						)
					) }
				</Text>
			) : null }
		</section>
	);
}
