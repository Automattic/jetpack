/**
 * External dependencies
 */
import { getLockedFeature, type StatsFeatureKey } from '@jetpack-premium-analytics/data';
import { ButtonLink, EmptyState, Icon } from '@jetpack-premium-analytics/externals';
import { createInterpolateElement, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { lock } from '@wordpress/icons';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import { useTrackEvent } from '../../hooks/use-track-event';
import { ExternalLink } from '../external-link';
import { useStatsUpgradeLinkProps } from '../stats-upgrade-link';
import styles from './locked-widget.module.scss';

type LockedStateProps = {
	feature: StatsFeatureKey;
	source: 'locked_widget' | 'locked_page';
	className?: string;
};

/**
 * The lock, the server's sentence for the feature and the upgrade button.
 *
 * @param props           - Component props.
 * @param props.feature   - The locked feature.
 * @param props.source    - Where the state shows, for the upgrade event.
 * @param props.className - Extra class for the root.
 * @return The locked state.
 */
function LockedState( { feature, source, className }: LockedStateProps ) {
	const trackEvent = useTrackEvent();
	const locked = getLockedFeature( feature );
	const upgradeLink = useStatsUpgradeLinkProps(
		'jetpack-premium-analytics-locked-feature',
		locked?.upgrade_url
	);

	return (
		<EmptyState.Root className={ clsx( styles.root, className ) }>
			<Icon size={ 40 } className={ styles.icon } icon={ lock } />
			{ locked?.description && (
				<EmptyState.Description>
					{ createInterpolateElement( locked.description, {
						link: locked.support_url ? (
							<ExternalLink href={ locked.support_url } variant="default" className={ styles.link }>
								{ null }
							</ExternalLink>
						) : (
							<Fragment />
						),
					} ) }
				</EmptyState.Description>
			) }
			{ locked && upgradeLink && (
				<EmptyState.Actions>
					<ButtonLink
						{ ...upgradeLink }
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
export function LockedWidget( { feature }: { feature: StatsFeatureKey } ) {
	return <LockedState feature={ feature } source="locked_widget" />;
}

/**
 * A report page or tab for a feature the site's plan does not include.
 *
 * @param props         - Component props.
 * @param props.feature - The locked feature.
 * @return The locked page.
 */
export function LockedPage( { feature }: { feature: StatsFeatureKey } ) {
	return <LockedState feature={ feature } source="locked_page" className={ styles.page } />;
}
