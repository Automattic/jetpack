/**
 * External dependencies
 */
import { ButtonLink, EmptyState, Icon } from '@jetpack-premium-analytics/externals';
import { __ } from '@wordpress/i18n';
import { lock } from '@wordpress/icons';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import { getStatsUpgradeUrl } from '../../helpers/plan-gates';
import { useTrackEvent } from '../../hooks/use-track-event';
import { getLockedFeatureCopy } from './feature-copy';
import styles from './locked-widget.module.scss';

type LockedStateProps = {
	feature?: string;
	source: 'locked_widget' | 'locked_page';
	className?: string;
};

/**
 * The lock, the feature's sentence and the upgrade button.
 *
 * @param props           - Component props.
 * @param props.feature   - The locked feature.
 * @param props.source    - Where the state shows, for the upgrade event.
 * @param props.className - Extra class for the root.
 * @return The locked state.
 */
function LockedState( { feature, source, className }: LockedStateProps ) {
	const trackEvent = useTrackEvent();
	const upgradeUrl = feature ? getStatsUpgradeUrl( feature ) : undefined;

	return (
		<EmptyState.Root className={ clsx( styles.root, className ) }>
			<Icon size={ 40 } className={ styles.icon } icon={ lock } />
			<EmptyState.Description>{ getLockedFeatureCopy( feature ) }</EmptyState.Description>
			{ upgradeUrl && (
				<EmptyState.Actions>
					<ButtonLink
						href={ upgradeUrl }
						onClick={ () =>
							trackEvent( 'jetpack_premium_analytics_plan_upgrade_click', { feature, source } )
						}
					>
						{ __( 'Upgrade', 'jetpack-premium-analytics-pkg' ) }
					</ButtonLink>
				</EmptyState.Actions>
			) }
		</EmptyState.Root>
	);
}

/**
 * A widget body for a feature the site's plan does not include.
 *
 * @param props         - Component props.
 * @param props.feature - The locked feature.
 * @return The locked body.
 */
export function LockedWidget( { feature }: { feature?: string } ) {
	return <LockedState feature={ feature } source="locked_widget" />;
}

/**
 * A report page or tab for a feature the site's plan does not include.
 *
 * @param props         - Component props.
 * @param props.feature - The locked feature.
 * @return The locked page.
 */
export function LockedPage( { feature }: { feature: string } ) {
	return <LockedState feature={ feature } source="locked_page" className={ styles.page } />;
}
