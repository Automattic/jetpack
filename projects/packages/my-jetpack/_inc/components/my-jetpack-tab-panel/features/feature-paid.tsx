import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { starFilled } from '@wordpress/icons';
import { Link, LinkButton, Text } from '@wordpress/ui';
import { useCallback } from 'react';
import useAnalytics from '../../../hooks/use-analytics';
import { getFeaturePricingHref } from '../utils';
import { FeatureHighlights } from './feature-highlights';
import { getForcedReason } from './feature-state';
import styles from './styles.module.scss';
import type { FeatureState } from './feature-state';

type PlanLinkProps = {
	plan: { slug: string; name: string };
	feature: string;
};

/**
 * A plan name that opens the plan's own pricing page.
 *
 * @param {PlanLinkProps} props         - The component props.
 * @param {object}        props.plan    - The plan's slug and display name.
 * @param {string}        props.feature - The feature whose details link here, for checkout to return to.
 * @return The rendered component.
 */
function PlanLink( { plan, feature }: PlanLinkProps ) {
	const { recordEvent } = useAnalytics();
	const onClick = useCallback(
		() => recordEvent( 'jetpack_myjetpack_features_plan_click', { feature, plan: plan.slug } ),
		[ feature, plan.slug, recordEvent ]
	);

	return (
		<Link href={ getFeaturePricingHref( `/add-${ plan.slug }`, feature ) } onClick={ onClick }>
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
 * Whether a host forced the feature off, which a purchase cannot change.
 *
 * @param state - Live state for the feature.
 * @return True when the feature is off and the host decides that.
 */
function isForcedOff( state: FeatureState ): boolean {
	return state.status !== 'active' && !! getForcedReason( state );
}

/**
 * The pricing route that sells a feature, or empty when there is nothing to sell.
 *
 * @param state - Live state for the feature.
 * @return The My Jetpack route.
 */
function getUpgradePath( state: FeatureState ): string {
	if ( isForcedOff( state ) ) {
		return '';
	}

	// Empty when the site already pays for the feature; the catalog decides that, not the client.
	return state.feature.upgrade?.path ?? '';
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
export function UpgradeButton( { state }: UpgradeButtonProps ) {
	const { feature } = state;
	const { recordEvent } = useAnalytics();
	const upgradePath = getUpgradePath( state );
	const onUpgrade = useCallback(
		() =>
			recordEvent( 'jetpack_myjetpack_features_upgrade_click', {
				feature: feature.slug,
				target: upgradePath,
			} ),
		[ feature.slug, recordEvent, upgradePath ]
	);

	if ( ! upgradePath ) {
		return null;
	}

	return (
		<LinkButton
			href={ getFeaturePricingHref( upgradePath, feature.slug ) }
			onClick={ onUpgrade }
			variant="outline"
			size="compact"
			// Upselling is not what the modal is open to reach, so focus skips it.
			data-feature-upgrade
			aria-label={ sprintf(
				/* translators: %s is a product name, such as "Jetpack Akismet Anti-spam". */
				__( 'Upgrade to %s', 'jetpack-my-jetpack' ),
				feature.upgrade?.name || feature.name
			) }
		>
			{ __( 'Upgrade', 'jetpack-my-jetpack' ) }
		</LinkButton>
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
	const showPlans = ! isForcedOff( state ) && plans.length > 0;

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
								<PlanLink key={ plan.slug } plan={ plan } feature={ feature.slug } />,
							] )
						)
					) }
				</Text>
			) : null }
		</section>
	);
}
