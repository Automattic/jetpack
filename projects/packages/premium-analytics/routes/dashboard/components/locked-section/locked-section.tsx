/**
 * External dependencies
 */
import { getLockedSection } from '@jetpack-premium-analytics/data';
import { Button, ButtonLink, Icon, Stack, Text } from '@jetpack-premium-analytics/externals';
import { formatMonthlyPrice } from '@jetpack-premium-analytics/formatters';
import { WidgetGridAnimation } from '@jetpack-premium-analytics/ui';
import { useTrackEvent } from '@jetpack-premium-analytics/widgets-toolkit';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { check, chevronDown, chevronUp, lock } from '@wordpress/icons';
import { useCallback, useEffect, useId, useState } from 'react';
/**
 * Internal dependencies
 */
import styles from './locked-section.module.scss';

/** Classic Stats lists this many features before "Show all". */
const COLLAPSED_FEATURE_COUNT = 4;

/**
 * The upgrade prompt that replaces a section the site's plan does not include, after classic Stats' upsell.
 *
 * @param props         - Component props.
 * @param props.section - The section slug.
 * @return The prompt, or null when the section is open.
 */
export function LockedSection( { section }: { section: string } ) {
	const trackEvent = useTrackEvent();
	const locked = getLockedSection( section );
	const [ isExpanded, setIsExpanded ] = useState( false );
	const moreFeaturesId = useId();
	const isLocked = !! locked;

	useEffect( () => {
		if ( isLocked ) {
			trackEvent( 'jetpack_premium_analytics_plan_upgrade_view', {
				section,
				source: 'locked_section',
			} );
		}
	}, [ isLocked, section, trackEvent ] );

	const toggleExpanded = useCallback( () => {
		if ( ! isExpanded ) {
			trackEvent( 'jetpack_premium_analytics_plan_upgrade_expand', {
				section,
				source: 'locked_section',
			} );
		}
		setIsExpanded( ! isExpanded );
	}, [ isExpanded, section, trackEvent ] );
	const trackUpgrade = useCallback(
		() =>
			trackEvent( 'jetpack_premium_analytics_plan_upgrade_click', {
				section,
				source: 'locked_section',
			} ),
		[ section, trackEvent ]
	);
	const trackLearnMore = useCallback(
		() =>
			trackEvent( 'jetpack_premium_analytics_plan_upgrade_learn_more_click', {
				section,
				source: 'locked_section',
			} ),
		[ section, trackEvent ]
	);

	if ( ! locked ) {
		return null;
	}

	const description = locked.plan_price
		? createInterpolateElement(
				// eslint-disable-next-line @wordpress/valid-sprintf -- The server translates the format, typed to hold a `%s`.
				sprintf(
					locked.description_with_price,
					formatMonthlyPrice( locked.plan_price.yearly, locked.plan_price.currency )
				),
				{ strong: <strong /> }
			)
		: locked.description;
	const mainFeatures = locked.features.slice( 0, COLLAPSED_FEATURE_COUNT );
	const moreFeatures = locked.features.slice( COLLAPSED_FEATURE_COUNT );
	const featureList = ( features: string[], id?: string ) => (
		<Stack id={ id } render={ <ul /> } direction="column" gap="sm" className={ styles.features }>
			{ features.map( feature => (
				<Stack key={ feature } render={ <li /> } direction="row" align="center" gap="sm">
					<Icon icon={ check } size={ 20 } className={ styles.check } />
					<Text variant="body-md">{ feature }</Text>
				</Stack>
			) ) }
		</Stack>
	);

	return (
		<div className={ styles.root }>
			<div className={ styles.content }>
				<Stack direction="column" align="start" gap="lg" className={ styles.copy }>
					<Icon icon={ lock } size={ 32 } />
					<Stack direction="column" gap="sm">
						<Text variant="heading-xl" render={ <h3 /> }>
							{ locked.title }
						</Text>
						<Text variant="body-lg" className={ styles.description }>
							{ description }
						</Text>
					</Stack>
					{ featureList( mainFeatures ) }
					<Stack direction="row" gap="sm" wrap="wrap">
						<ButtonLink href={ locked.upgrade_url } onClick={ trackUpgrade }>
							{ locked.upgrade_label }
						</ButtonLink>
						<ButtonLink
							href={ locked.support_url }
							variant="outline"
							openInNewTab
							onClick={ trackLearnMore }
						>
							{ __( 'Learn more', 'jetpack-premium-analytics-pkg' ) }
						</ButtonLink>
					</Stack>
					{ /* Below the buttons, as in classic Stats, so expanding never moves them. */ }
					{ moreFeatures.length > 0 && (
						<Button
							variant="minimal"
							size="compact"
							aria-expanded={ isExpanded }
							aria-controls={ moreFeaturesId }
							onClick={ toggleExpanded }
						>
							{ isExpanded
								? __( 'Show less', 'jetpack-premium-analytics-pkg' )
								: locked.expand_label }
							<Button.Icon icon={ isExpanded ? chevronUp : chevronDown } />
						</Button>
					) }
					{ /* Always rendered, so `aria-controls` points at an element while collapsed. */ }
					{ moreFeatures.length > 0 && (
						<div hidden={ ! isExpanded }>{ featureList( moreFeatures, moreFeaturesId ) }</div>
					) }
				</Stack>
				<div className={ styles.visual }>
					<WidgetGridAnimation />
				</div>
			</div>
		</div>
	);
}
