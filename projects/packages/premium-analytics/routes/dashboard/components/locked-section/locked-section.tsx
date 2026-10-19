/**
 * External dependencies
 */
import { getLockedSection } from '@jetpack-premium-analytics/data';
import { Button, ButtonLink, Icon, Stack, Text } from '@jetpack-premium-analytics/externals';
import { WidgetGridAnimation } from '@jetpack-premium-analytics/ui';
import { useTrackEvent } from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { check, chevronDown, chevronUp, lock } from '@wordpress/icons';
import { useCallback, useEffect, useState } from 'react';
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
	const isLocked = !! locked;

	useEffect( () => {
		if ( isLocked ) {
			trackEvent( 'jetpack_premium_analytics_plan_upgrade_view', {
				section,
				source: 'locked_section',
			} );
		}
	}, [ isLocked, section, trackEvent ] );

	const toggleExpanded = useCallback( () => setIsExpanded( expanded => ! expanded ), [] );
	const trackUpgrade = useCallback(
		() =>
			trackEvent( 'jetpack_premium_analytics_plan_upgrade_click', {
				section,
				source: 'locked_section',
			} ),
		[ section, trackEvent ]
	);

	if ( ! locked ) {
		return null;
	}

	const mainFeatures = locked.features.slice( 0, COLLAPSED_FEATURE_COUNT );
	const moreFeatures = locked.features.slice( COLLAPSED_FEATURE_COUNT );
	const featureList = ( features: string[] ) => (
		<Stack render={ <ul /> } direction="column" gap="sm" className={ styles.features }>
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
						<Text variant="heading-xl" render={ <h2 /> }>
							{ locked.title }
						</Text>
						<Text variant="body-lg" className={ styles.description }>
							{ locked.description }
						</Text>
					</Stack>
					{ featureList( mainFeatures ) }
					<Stack direction="row" gap="sm" wrap="wrap">
						<ButtonLink href={ locked.upgrade_url } onClick={ trackUpgrade }>
							{ locked.upgrade_label }
						</ButtonLink>
						<ButtonLink href={ locked.support_url } variant="outline" openInNewTab>
							{ __( 'Learn more', 'jetpack-premium-analytics-pkg' ) }
						</ButtonLink>
					</Stack>
					{ /* Below the buttons, as in classic Stats, so expanding never moves them. */ }
					{ moreFeatures.length > 0 && (
						<Button
							variant="minimal"
							size="compact"
							aria-expanded={ isExpanded }
							onClick={ toggleExpanded }
						>
							{ isExpanded
								? __( 'Show less', 'jetpack-premium-analytics-pkg' )
								: locked.expand_label }
							<Button.Icon icon={ isExpanded ? chevronUp : chevronDown } />
						</Button>
					) }
					{ isExpanded && featureList( moreFeatures ) }
				</Stack>
				<div className={ styles.visual }>
					<WidgetGridAnimation />
				</div>
			</div>
		</div>
	);
}
