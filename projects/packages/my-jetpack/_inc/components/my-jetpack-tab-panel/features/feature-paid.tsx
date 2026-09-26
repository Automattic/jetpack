import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { starFilled } from '@wordpress/icons';
import { Link, LinkButton, Stack, Text } from '@wordpress/ui';
import { useCallback } from 'react';
import useAnalytics from '../../../hooks/use-analytics';
import { FeatureHighlights } from './feature-highlights';
import { getForcedReason } from './feature-state';
import styles from './styles.module.scss';
import type { FeatureState } from './feature-state';
import type { FeatureFilter } from './use-feature-filter';

type PlanLinkProps = {
	plan: { slug: string; name: string };
	onSelect: ( plan: FeatureFilter ) => void;
};

/**
 * A plan name that filters the list to everything that plan includes.
 *
 * @param {PlanLinkProps} props          - The component props.
 * @param {object}        props.plan     - The plan's slug and display name.
 * @param {Function}      props.onSelect - Filters the list to one plan.
 * @return The rendered component.
 */
function PlanLink( { plan, onSelect }: PlanLinkProps ) {
	const onClick = useCallback(
		() => onSelect( plan.slug as FeatureFilter ),
		[ onSelect, plan.slug ]
	);

	return (
		<Link
			render={ <button type="button" /> }
			className={ styles[ 'plan-link' ] }
			onClick={ onClick }
			title={ sprintf(
				/* translators: %s is a plan name, such as "Jetpack Complete". */
				__( 'Show everything in %s', 'jetpack-my-jetpack' ),
				plan.name
			) }
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

type FeaturePaidProps = {
	state: FeatureState;
	onFilterByPlan: ( plan: FeatureFilter ) => void;
};

/**
 * What a paid plan adds, which plans include it, and the way to buy it.
 *
 * @param {FeaturePaidProps} props                - The component props.
 * @param {FeatureState}     props.state          - Live state for the feature.
 * @param {Function}         props.onFilterByPlan - Filters the list to one plan.
 * @return The rendered component.
 */
export function FeaturePaid( { state, onFilterByPlan }: FeaturePaidProps ) {
	const { feature } = state;
	const { recordEvent } = useAnalytics();
	const plans = feature.plans ?? [];
	const highlights = feature.paid_highlights ?? [];
	// A host that forced it off decides this, not a purchase.
	const isForcedOff = state.status !== 'active' && !! getForcedReason( state );
	const showPlans = ! isForcedOff && plans.length > 0;
	// Empty when the site already pays for the feature; the catalog decides that, not the client.
	const upgrade = feature.upgrade ?? { path: '', name: '' };
	const upgradePath = isForcedOff ? '' : upgrade.path;
	const onUpgrade = useCallback(
		() =>
			recordEvent( 'jetpack_myjetpack_features_upgrade_click', {
				feature: feature.slug,
				target: upgradePath,
			} ),
		[ feature.slug, recordEvent, upgradePath ]
	);

	if ( ! highlights.length && ! showPlans && ! upgradePath ) {
		return null;
	}

	return (
		<section className={ styles[ 'detail-section' ] }>
			<Text variant="heading-sm" render={ <h3 /> }>
				{ __( 'With a paid plan', 'jetpack-my-jetpack' ) }
			</Text>

			{ highlights.length ? <FeatureHighlights items={ highlights } icon={ starFilled } /> : null }

			{ showPlans || upgradePath ? (
				<Stack direction="column" gap="sm" align="start" className={ styles[ 'paid-routes' ] }>
					{ showPlans ? (
						<Text variant="body-sm">
							{ createInterpolateElement(
								getIncludedIn( plans.length ),
								Object.fromEntries(
									plans.map( ( plan, index ) => [
										`plan${ index }`,
										<PlanLink key={ plan.slug } plan={ plan } onSelect={ onFilterByPlan } />,
									] )
								)
							) }
						</Text>
					) : null }

					{ upgradePath ? (
						<LinkButton
							href={ `#${ upgradePath }` }
							onClick={ onUpgrade }
							variant="outline"
							size="compact"
							aria-label={ sprintf(
								/* translators: %s is a product name, such as "Jetpack Akismet Anti-spam". */
								__( 'Upgrade to %s', 'jetpack-my-jetpack' ),
								upgrade.name || feature.name
							) }
						>
							{ __( 'Upgrade', 'jetpack-my-jetpack' ) }
						</LinkButton>
					) : null }
				</Stack>
			) : null }
		</section>
	);
}
