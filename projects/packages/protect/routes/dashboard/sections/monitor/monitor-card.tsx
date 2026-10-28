import apiFetch from '@wordpress/api-fetch';
import { getSettings, gmdateI18n } from '@wordpress/date';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Badge, Button, Link, Skeleton, Stack, Text, Tooltip, VisuallyHidden } from '@wordpress/ui';
import { CardRow, ProtectCard, SettingsErrorRow, UnavailableCard } from '../../components/card';
import formatNumber from '../../components/format-number';
import TabLink from '../../components/tab-link';
import isModuleActive from '../../data/is-module-active';
import { recordEvent } from '../../data/tracks';
import gauge from './icon';
import MonitorToggle, { useMonitorToggleData } from './monitor-toggle';
import type { MonitorContext, Uptime, UptimeDay } from './types';
import type { CardStatus } from '../../components/card';
import './style.scss';

const UPTIME_PATH = '/jetpack/v4/protect-dashboard/uptime';
const CONNECT_URL = 'admin.php?page=my-jetpack#/connection';
const MINUTES_PER_DAY = 1440;
const onConnect = () =>
	recordEvent( 'jetpack_protect_monitor_connect_link_click', { use_beacon: true } );
const PERCENT = { style: 'percent', maximumFractionDigits: 3 } as const;

/** Opens the Settings tab at this section's card. */
const SETTINGS_PARAMS = { section: 'monitor' };

// The only setting this card saves.
const MONITOR_KEYS = [ 'monitor' ];

/**
 * A day's date, in the site's date format.
 *
 * @param day - The day.
 * @return The date.
 */
function formatDay( day: UptimeDay ): string {
	// Days are UTC dates, so format them in UTC to keep the same day.
	return gmdateI18n( getSettings().formats.date, `${ day.date }T00:00:00Z` );
}

/**
 * What happened on a day.
 *
 * @param day - The day.
 * @return The text.
 */
function describeStatus( day: UptimeDay ): string {
	if ( day.status === 'up' ) {
		return __( 'Operational all day', 'jetpack-protect-pkg' );
	}
	if ( day.status === 'down' ) {
		return sprintf(
			/* translators: %d is a number of minutes. */
			_n(
				'Down for %d minute',
				'Down for %d minutes',
				day.downtimeInMinutes,
				'jetpack-protect-pkg'
			),
			day.downtimeInMinutes
		);
	}
	return __( 'No data', 'jetpack-protect-pkg' );
}

/**
 * Share of monitored time the site was up, skipping days with no data.
 *
 * @param days - The days.
 * @return The percentage, or null when no day was monitored.
 */
function getUptimePercent( days: UptimeDay[] ): number | null {
	const monitored = days.filter( day => day.status !== 'monitor_inactive' );
	if ( ! monitored.length ) {
		return null;
	}
	const minutes = monitored.length * MINUTES_PER_DAY;
	const down = monitored.reduce(
		( sum, day ) => sum + Math.min( day.downtimeInMinutes, MINUTES_PER_DAY ),
		0
	);
	return ( 100 * ( minutes - down ) ) / minutes;
}

/**
 * The card's badge.
 *
 * @param connected - Whether the user has a WordPress.com connection.
 * @param uptime    - The uptime response, once loaded.
 * @param failed    - Whether loading it failed.
 * @return The badge, if any.
 */
function getStatus(
	connected: boolean,
	uptime: Uptime | null,
	failed: boolean
): CardStatus | undefined {
	if ( ! connected ) {
		return { label: __( 'On', 'jetpack-protect-pkg' ), intent: 'none' };
	}
	if ( uptime?.isUp === true ) {
		return { label: __( 'Operational', 'jetpack-protect-pkg' ), intent: 'stable' };
	}
	if ( uptime?.isUp === false ) {
		return { label: __( 'Down', 'jetpack-protect-pkg' ), intent: 'high' };
	}
	if ( uptime || failed ) {
		return { label: __( 'Status unknown', 'jetpack-protect-pkg' ), intent: 'none' };
	}
	return undefined;
}

/**
 * The Monitor card: current status and daily uptime, one bar per day.
 *
 * @param props          - The dashboard context.
 * @param props.state    - The Monitor module's state from PHP.
 * @param props.settings - Jetpack settings, for the module's live state.
 * @param props.openTab  - Switches dashboard tabs, for the link to Settings.
 * @return The card.
 */
export default function MonitorCard( { state: monitor, settings, openTab }: MonitorContext ) {
	const available = Boolean( monitor?.available );
	// Saves apply optimistically, and the uptime route refuses until Monitor is really on.
	const active =
		available &&
		! settings.isSaving( 'monitor' ) &&
		isModuleActive( settings.settings, 'monitor', Boolean( monitor?.active ) );
	const { refresh } = settings;
	const [ uptime, setUptime ] = useState< Uptime | null >( null );
	const [ error, setError ] = useState< string | null >( null );
	const [ retries, setRetries ] = useState( 0 );
	const connected = Boolean( monitor?.userConnected ) && error !== 'not_connected';
	const failed = connected && error !== null;
	const canLoad = active && Boolean( monitor?.userConnected );
	const retry = useCallback( () => setRetries( count => count + 1 ), [] );

	useEffect( () => {
		if ( ! canLoad ) {
			return;
		}
		let current = true;
		setUptime( null );
		setError( null );
		// A retry skips the failure the server remembers for a minute.
		apiFetch< Uptime >( { path: retries ? `${ UPTIME_PATH }?retry=1` : UPTIME_PATH } )
			.then( response => current && setUptime( response ) )
			.catch( async ( e: { code?: string } ) => {
				// Monitor was turned off elsewhere: re-read it so the card and its toggle show Off.
				if ( e?.code === 'monitor_inactive' ) {
					await refresh( [ 'monitor' ] );
				}
				return current && setError( e?.code ?? 'uptime_unavailable' );
			} );
		return () => {
			current = false;
		};
	}, [ canLoad, retries, refresh ] );

	const days = uptime?.days;
	const status = getStatus( connected, uptime, failed );
	const uptimePercent = days ? getUptimePercent( days ) : null;
	const dayLabels = days?.map( day => ( {
		day,
		date: formatDay( day ),
		text: describeStatus( day ),
	} ) );

	const title = __( 'Downtime monitoring', 'jetpack-protect-pkg' );
	const { data: toggleData } = useMonitorToggleData( settings );

	if ( ! available ) {
		return <UnavailableCard icon={ gauge } title={ title } />;
	}

	return (
		<ProtectCard
			icon={ gauge }
			title={ title }
			description={ __(
				'Find out your site is down before your visitors do, with an email alert within minutes.',
				'jetpack-protect-pkg'
			) }
		>
			<SettingsErrorRow settings={ settings } keys={ MONITOR_KEYS } />
			{ ! active && (
				<CardRow>
					<MonitorToggle data={ toggleData } available />
				</CardRow>
			) }
			{ active && (
				<CardRow className="jp-protect-uptime-row">
					<Stack direction="column" gap="lg">
						<Stack direction="row" gap="md" align="center" justify="space-between">
							{ connected ? (
								<Stack direction="row" gap="sm" align="baseline">
									<Text variant="body-md">
										{ sprintf(
											/* translators: %d is a number of days. */
											__( 'Last %d days uptime', 'jetpack-protect-pkg' ),
											days?.length ?? monitor?.uptimeDays ?? 0
										) }
									</Text>
								</Stack>
							) : (
								<Text variant="body-md">
									{ __(
										'Your site is being monitored. Connect your WordPress.com account to see its uptime history.',
										'jetpack-protect-pkg'
									) }
								</Text>
							) }
							<Stack direction="row" gap="sm" align="center">
								{ connected && uptimePercent !== null && (
									<Text variant="heading-md">{ formatNumber( uptimePercent / 100, PERCENT ) }</Text>
								) }
								{ status && <Badge intent={ status.intent }>{ status.label }</Badge> }
							</Stack>
						</Stack>
						{ ! connected && (
							<div>
								<Link href={ CONNECT_URL } onClick={ onConnect }>
									{ __( 'Connect your account', 'jetpack-protect-pkg' ) }
								</Link>
							</div>
						) }
						{ failed && (
							<Stack direction="row" gap="sm" align="center">
								<Text variant="body-md">
									{ __( 'Uptime history is unavailable right now.', 'jetpack-protect-pkg' ) }
								</Text>
								<Button variant="minimal" size="compact" onClick={ retry }>
									{ __( 'Try again', 'jetpack-protect-pkg' ) }
								</Button>
							</Stack>
						) }
						{ connected && ! failed && ! days && (
							<Skeleton className="jp-protect-uptime__skeleton" />
						) }
						{ dayLabels && (
							<>
								<Tooltip.Provider delay={ 0 }>
									<div className="jp-protect-uptime" aria-hidden="true">
										{ dayLabels.map( ( { day, date, text } ) => (
											<Tooltip.Root key={ day.date }>
												<Tooltip.Trigger
													render={
														<span className={ `jp-protect-uptime__bar is-${ day.status }` } />
													}
												/>
												<Tooltip.Popup>
													<span className="jp-protect-uptime__tip-date">{ date }</span>
													<span className={ `jp-protect-uptime__tip-status is-${ day.status }` }>
														{ text }
													</span>
												</Tooltip.Popup>
											</Tooltip.Root>
										) ) }
									</div>
								</Tooltip.Provider>
								<VisuallyHidden>
									<ul>
										{ dayLabels.map( ( { day, date, text } ) => (
											<li key={ day.date }>{ `${ date }: ${ text }` }</li>
										) ) }
									</ul>
								</VisuallyHidden>
							</>
						) }
						<div>
							<TabLink tab="settings" params={ SETTINGS_PARAMS } onOpen={ openTab }>
								{ __( 'Configure downtime monitoring', 'jetpack-protect-pkg' ) }
							</TabLink>
						</div>
					</Stack>
				</CardRow>
			) }
		</ProtectCard>
	);
}
