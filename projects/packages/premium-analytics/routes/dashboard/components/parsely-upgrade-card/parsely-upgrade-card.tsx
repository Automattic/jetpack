/**
 * External dependencies
 */
import {
	getParselySignupUrl,
	offersParselyPrompts,
	useSiteHomeUrl,
	useSiteTitle,
} from '@jetpack-premium-analytics/data';
import {
	ButtonLink,
	Card,
	Icon,
	IconButton,
	Stack,
	Text,
} from '@jetpack-premium-analytics/externals';
import { useTrackEvent } from '@jetpack-premium-analytics/widgets-toolkit';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { arrowUpRight, close } from '@wordpress/icons';
import { store as preferencesStore } from '@wordpress/preferences';
import { useCallback, useEffect, useId, useState } from 'react';
/**
 * Internal dependencies
 */
import {
	DASHBOARD_PARSELY_UPGRADE_CARD_KEY,
	DASHBOARD_PREFERENCES_SCOPE,
} from '../../hooks/constants';
import styles from './parsely-upgrade-card.module.scss';
import type { JSX } from 'react';

type ParselyUpgradeCardProps = {
	/**
	 * Whether the surface the card belongs to shows it; the site's eligibility is the card's own check.
	 */
	enabled: boolean;
};

/** How often the reader closed the card, and when they last did. */
export type ParselyUpgradeCardDismissal = {
	count: number;
	at: string;
};

type PreferencesSelectors = {
	get: ( scope: string, key: string ) => ParselyUpgradeCardDismissal | undefined;
};

type PreferencesActions = {
	set: ( scope: string, key: string, value: ParselyUpgradeCardDismissal ) => Promise< void > | void;
};

const TRACKS_SOURCE = 'traffic_card';

// The first close is a snooze; the second is for good.
const SNOOZE_DAYS = 90;
const SNOOZE_MS = SNOOZE_DAYS * 24 * 60 * 60 * 1000;

/**
 * Whether a stored dismissal still hides the card.
 *
 * @param dismissal - The stored record, if any.
 * @param now       - The current time, in ms.
 * @return True while the card stays closed.
 */
export function isParselyUpgradeCardDismissed(
	dismissal: ParselyUpgradeCardDismissal | undefined,
	now: number
): boolean {
	if ( ! dismissal ) {
		return false;
	}
	if ( dismissal.count >= 2 ) {
		return true;
	}
	const at = Date.parse( dismissal.at );

	return Number.isNaN( at ) || now - at < SNOOZE_MS;
}

// Once per page load, not per mount: the dashboard stage remounts on the way
// back from a report, before the persisted preference has necessarily landed.
let hasClosedThisLoad = false;
let hasRecordedViewThisLoad = false;

/**
 * Reset the once-per-load latches. Test-only.
 */
export function resetParselyUpgradeCardForTesting() {
	hasClosedThisLoad = false;
	hasRecordedViewThisLoad = false;
}

/**
 * Stands below the widgets offering Parse.ly to a site that outgrew Stats, until the reader closes it.
 *
 * @param {ParselyUpgradeCardProps} props - Component props.
 * @return The card, or null.
 */
export function ParselyUpgradeCard( { enabled }: ParselyUpgradeCardProps ): JSX.Element | null {
	const trackEvent = useTrackEvent();
	const titleId = useId();
	const siteUrl = useSiteHomeUrl();
	const siteTitle = useSiteTitle();

	const dismissal = useSelect(
		select =>
			( select( preferencesStore ) as unknown as PreferencesSelectors ).get(
				DASHBOARD_PREFERENCES_SCOPE,
				DASHBOARD_PARSELY_UPGRADE_CARD_KEY
			),
		[]
	);
	const { set } = useDispatch( preferencesStore ) as unknown as PreferencesActions;
	const [ isClosed, setIsClosed ] = useState( () => hasClosedThisLoad );

	const isVisible =
		enabled &&
		offersParselyPrompts() &&
		! isClosed &&
		! isParselyUpgradeCardDismissed( dismissal, Date.now() );

	useEffect( () => {
		if ( ! isVisible || hasRecordedViewThisLoad ) {
			return;
		}

		hasRecordedViewThisLoad = true;
		trackEvent( 'jetpack_premium_analytics_parsely_upgrade_view', { source: TRACKS_SOURCE } );
	}, [ isVisible, trackEvent ] );

	const dismiss = useCallback( () => {
		const count = ( dismissal?.count ?? 0 ) + 1;

		hasClosedThisLoad = true;
		setIsClosed( true );
		void set( DASHBOARD_PREFERENCES_SCOPE, DASHBOARD_PARSELY_UPGRADE_CARD_KEY, {
			count,
			at: new Date().toISOString(),
		} );
		trackEvent( 'jetpack_premium_analytics_parsely_upgrade_dismiss', {
			source: TRACKS_SOURCE,
			dismissal: count >= 2 ? 'final' : 'snooze',
		} );
	}, [ dismissal, set, trackEvent ] );

	const trackUpgrade = useCallback(
		() =>
			trackEvent( 'jetpack_premium_analytics_parsely_upgrade_click', { source: TRACKS_SOURCE } ),
		[ trackEvent ]
	);

	if ( ! isVisible ) {
		return null;
	}

	const features = [
		__( 'Real-time analytics', 'jetpack-premium-analytics-pkg' ),
		__( 'Engaged time', 'jetpack-premium-analytics-pkg' ),
		__( 'New and returning visitors', 'jetpack-premium-analytics-pkg' ),
		__( 'Recirculation rate', 'jetpack-premium-analytics-pkg' ),
		__( 'Goals', 'jetpack-premium-analytics-pkg' ),
		__( 'Scheduled reports', 'jetpack-premium-analytics-pkg' ),
	];

	return (
		<Card.Root role="region" aria-labelledby={ titleId } className={ styles.root }>
			<Card.Header>
				<Stack direction="row" justify="space-between" align="center" gap="md">
					<Stack direction="row" align="center" gap="sm">
						<Icon icon={ arrowUpRight } size={ 20 } />
						<Card.Title id={ titleId }>
							{ __( 'The next step after Stats', 'jetpack-premium-analytics-pkg' ) }
						</Card.Title>
					</Stack>
					<IconButton
						variant="minimal"
						tone="neutral"
						size="small"
						icon={ close }
						label={ __( 'Dismiss', 'jetpack-premium-analytics-pkg' ) }
						onClick={ dismiss }
					/>
				</Stack>
			</Card.Header>
			<Card.Content>
				<div className={ styles.content }>
					<Stack direction="column" gap="xs">
						<Text variant="heading-xl" render={ <h3 /> }>
							{ __( 'You’ve outgrown counting.', 'jetpack-premium-analytics-pkg' ) }
						</Text>
						<Text variant="body-md" className={ styles.description }>
							{ __(
								'Grow with Parse.ly, the favorite analytics provider for professional brands and media companies. See which stories hold attention, not just which ones get clicks.',
								'jetpack-premium-analytics-pkg'
							) }
						</Text>
					</Stack>

					<Stack direction="column" gap="sm">
						<div className={ styles.headline }>
							<Text variant="heading-xl" className={ styles.metrics }>
								{ __( '30+ audience metrics', 'jetpack-premium-analytics-pkg' ) }
							</Text>
							<Text variant="body-md">
								{ __(
									'to understand your audience and optimize for them',
									'jetpack-premium-analytics-pkg'
								) }
							</Text>
						</div>
						<Stack
							render={ <ul /> }
							direction="row"
							align="center"
							gap="sm"
							wrap="wrap"
							className={ styles.features }
						>
							{ features.map( feature => (
								<Text
									key={ feature }
									render={ <li /> }
									variant="body-sm"
									className={ styles.feature }
								>
									{ feature }
								</Text>
							) ) }
							<Text render={ <li /> } variant="body-md" className={ styles.description }>
								{ __( 'and much more', 'jetpack-premium-analytics-pkg' ) }
							</Text>
						</Stack>
					</Stack>

					<ButtonLink
						href={ getParselySignupUrl( { url: siteUrl, title: siteTitle } ) }
						openInNewTab
						onClick={ trackUpgrade }
						className={ styles.action }
					>
						{ __( 'Upgrade to Parse.ly', 'jetpack-premium-analytics-pkg' ) }
					</ButtonLink>
				</div>
			</Card.Content>
		</Card.Root>
	);
}
