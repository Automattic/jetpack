import { __, sprintf } from '@wordpress/i18n';
import { starFilled } from '@wordpress/icons';
import { Badge, Icon, Stack, Text } from '@wordpress/ui';
import { useCallback } from 'react';
import styles from './styles.module.scss';
import type { FeatureState } from './feature-state';
import type { FeatureFilter } from './use-feature-filter';

type PlanBadgeProps = {
	plan: { slug: string; name: string };
	onSelect: ( plan: FeatureFilter ) => void;
};

/**
 * A plan badge that filters the list to everything that plan includes.
 *
 * @param {PlanBadgeProps} props          - The component props.
 * @param {object}         props.plan     - The plan's slug and display name.
 * @param {Function}       props.onSelect - Filters the list to one plan.
 * @return The rendered component.
 */
function PlanBadge( { plan, onSelect }: PlanBadgeProps ) {
	const onClick = useCallback(
		() => onSelect( plan.slug as FeatureFilter ),
		[ onSelect, plan.slug ]
	);

	return (
		<button
			type="button"
			className={ styles[ 'badge-link' ] }
			onClick={ onClick }
			title={ sprintf(
				/* translators: %s is a plan name, such as "Jetpack Complete". */
				__( 'Show everything in %s', 'jetpack-my-jetpack' ),
				plan.name
			) }
		>
			<Badge intent="informational">{ plan.name }</Badge>
		</button>
	);
}

type FeaturePaidProps = {
	state: FeatureState;
	onFilterByPlan: ( plan: FeatureFilter ) => void;
};

/**
 * What a paid plan adds, and what to buy to get it.
 *
 * The two belong together: a list of benefits with no way to act on it, or a row of
 * plan names with nothing to justify them, are each half an answer.
 *
 * @param {FeaturePaidProps} props                - The component props.
 * @param {FeatureState}     props.state          - Live state for the feature.
 * @param {Function}         props.onFilterByPlan - Filters the list to one plan.
 * @return The rendered component.
 */
export function FeaturePaid( { state, onFilterByPlan }: FeaturePaidProps ) {
	const { feature } = state;
	const plans = feature.plans ?? [];
	const paidProduct = feature.paid_product;

	// A paid-only feature's "What you get" is already the paid list, so repeating it
	// here would say everything twice. The routes are still worth showing.
	const highlights = state.action === 'learn_more' ? [] : feature.paid_highlights ?? [];
	const routes = plans.length > 0 || !! paidProduct;

	if ( ! highlights.length && ! routes ) {
		return null;
	}

	return (
		<section className={ styles[ 'detail-section' ] }>
			<Text variant="heading-sm" render={ <h3 /> }>
				{ __( 'With a paid plan', 'jetpack-my-jetpack' ) }
			</Text>

			{ highlights.length ? (
				<Stack direction="column" gap="sm">
					{ highlights.map( highlight => (
						<Stack key={ highlight } direction="row" align="start" gap="sm">
							<Icon icon={ starFilled } size={ 20 } />
							<Text variant="body-md">{ highlight }</Text>
						</Stack>
					) ) }
				</Stack>
			) : null }

			{ routes ? (
				<Stack direction="column" gap="sm" className={ styles[ 'paid-routes' ] }>
					<Text variant="body-sm">{ __( 'Comes with', 'jetpack-my-jetpack' ) }</Text>
					<Stack direction="row" align="center" gap="sm" wrap="wrap">
						{ plans.map( plan => (
							<PlanBadge key={ plan.slug } plan={ plan } onSelect={ onFilterByPlan } />
						) ) }
						{ paidProduct ? <Badge>{ paidProduct }</Badge> : null }
					</Stack>
				</Stack>
			) : null }
		</section>
	);
}
