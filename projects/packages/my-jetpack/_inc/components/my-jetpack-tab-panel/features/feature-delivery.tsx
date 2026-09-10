import { __, sprintf } from '@wordpress/i18n';
import { Badge, Stack, Text } from '@wordpress/ui';
import { useCallback } from 'react';
import { isJetpackPluginActive } from '../../../utils/is-jetpack-plugin-active';
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

type FeatureDeliveryProps = {
	state: FeatureState;
	onFilterByPlan: ( plan: FeatureFilter ) => void;
};

/**
 * Where the feature comes from, as badges rather than sentences.
 *
 * Turning a feature on can install a whole plugin, which is worth saying before
 * someone clicks rather than after.
 *
 * @param {FeatureDeliveryProps} props                - The component props.
 * @param {FeatureState}         props.state          - Live state for the feature.
 * @param {Function}             props.onFilterByPlan - Filters the list to one plan.
 * @return The rendered component.
 */
export function FeatureDelivery( { state, onFilterByPlan }: FeatureDeliveryProps ) {
	const { feature, product } = state;
	// Saying "In Jetpack" to someone already running Jetpack tells them nothing.
	const inJetpack = !! feature.delivery?.in_jetpack && ! isJetpackPluginActive();
	const { standalone } = feature.delivery ?? {};
	const plans = feature.plans ?? [];
	const paidProduct = feature.paid_product;

	if ( ! inJetpack && ! standalone && ! plans.length && ! paidProduct ) {
		return null;
	}

	// The product's own plugin slug is the wordpress.org one.
	const repoUrl = product?.pluginSlug
		? `https://wordpress.org/plugins/${ product.pluginSlug }/`
		: '';

	const note = () => {
		if ( state.action === 'install' && standalone ) {
			return sprintf(
				/* translators: %s is a plugin name, such as "Jetpack Protect". */
				__( 'Turning it on installs and activates %s for you.', 'jetpack-my-jetpack' ),
				standalone
			);
		}

		if ( state.action === 'install' || state.action === 'activate' ) {
			return __( 'Turning it on switches it on straight away.', 'jetpack-my-jetpack' );
		}

		return '';
	};

	const consequence = note();

	return (
		<div className={ styles[ 'detail-highlights' ] }>
			<Text variant="heading-md">{ __( 'How to get it', 'jetpack-my-jetpack' ) }</Text>

			<Stack direction="row" align="center" gap="sm" wrap="wrap">
				{ inJetpack ? (
					<Badge intent="stable">{ __( 'In Jetpack', 'jetpack-my-jetpack' ) }</Badge>
				) : null }
				{ standalone && repoUrl ? (
					<a
						href={ repoUrl }
						target="_blank"
						rel="noreferrer"
						className={ styles[ 'badge-link' ] }
						title={ sprintf(
							/* translators: %s is a plugin name, such as "Jetpack Protect". */
							__( 'View %s on WordPress.org', 'jetpack-my-jetpack' ),
							standalone
						) }
					>
						<Badge intent="informational">{ standalone }</Badge>
					</a>
				) : null }
				{ standalone && ! repoUrl ? <Badge intent="informational">{ standalone }</Badge> : null }
			</Stack>

			{ consequence ? <Text variant="body-sm">{ consequence }</Text> : null }

			{ plans.length || paidProduct ? (
				<>
					<Text variant="body-sm">{ __( 'Paid features come with', 'jetpack-my-jetpack' ) }</Text>
					<Stack direction="row" align="center" gap="sm" wrap="wrap">
						{ plans.map( plan => (
							<PlanBadge key={ plan.slug } plan={ plan } onSelect={ onFilterByPlan } />
						) ) }
						{ paidProduct ? <Badge>{ paidProduct }</Badge> : null }
					</Stack>
				</>
			) : null }
		</div>
	);
}
