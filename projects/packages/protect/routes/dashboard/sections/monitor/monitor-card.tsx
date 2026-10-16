import apiFetch from '@wordpress/api-fetch';
import { getSettings, gmdateI18n } from '@wordpress/date';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { seen } from '@wordpress/icons';
import { Button, Link, Skeleton, Stack, Text, VisuallyHidden } from '@wordpress/ui';
import { CardRow, ProtectCard } from '../../components/card';
import TabLink from '../../components/tab-link';
import isModuleActive from '../../data/is-module-active';
import type { MonitorContext, Uptime, UptimeDay } from './types';
import type { CardStatus } from '../../components/card';
import './style.scss';

const UPTIME_PATH = '/jetpack/v4/protect-dashboard/uptime';
const CONNECT_URL = 'admin.php?page=my-jetpack#/connection';

/**
 * Text for one day's bar.
 *
 * @param day - The day.
 * @return The text.
 */
function describeDay( day: UptimeDay ): string {
	// Days are UTC dates, so format them in UTC to keep the same day.
	const date = gmdateI18n( getSettings().formats.date, `${ day.date }T00:00:00Z` );
	if ( day.status === 'up' ) {
		/* translators: %s is a date. */
		return sprintf( __( '%s: 100%% uptime', 'jetpack-protect-pkg' ), date );
	}
	if ( day.status === 'down' ) {
		return sprintf(
			/* translators: %1$s is a date. %2$d is a number of minutes. */
			_n(
				'%1$s: down for %2$d minute',
				'%1$s: down for %2$d minutes',
				day.downtimeInMinutes,
				'jetpack-protect-pkg'
			),
			date,
			day.downtimeInMinutes
		);
	}
	/* translators: %s is a date. */
	return sprintf( __( '%s: no data', 'jetpack-protect-pkg' ), date );
}

/**
 * The card's badge.
 *
 * @param available - Whether Monitor can run on this site.
 * @param active    - Whether Monitor is on.
 * @param connected - Whether the user has a WordPress.com connection.
 * @param uptime    - The uptime response, once loaded.
 * @param failed    - Whether loading it failed.
 * @return The badge, if any.
 */
function getStatus(
	available: boolean,
	active: boolean,
	connected: boolean,
	uptime: Uptime | null,
	failed: boolean
): CardStatus | undefined {
	if ( ! available ) {
		return { label: __( 'Unavailable', 'jetpack-protect-pkg' ), intent: 'draft' };
	}
	if ( ! active ) {
		return { label: __( 'Off', 'jetpack-protect-pkg' ), intent: 'draft' };
	}
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
	const count = ( status: UptimeDay[ 'status' ] ) =>
		days?.filter( day => day.status === status ).length ?? 0;
	const summary = sprintf(
		/* translators: %1$s, %2$s and %3$s are counts of days: "38 days up", "1 day down", "1 day with no data". */
		__( '%1$s, %2$s, %3$s', 'jetpack-protect-pkg' ),
		/* translators: %d is a number of days. */
		sprintf( _n( '%d day up', '%d days up', count( 'up' ), 'jetpack-protect-pkg' ), count( 'up' ) ),
		sprintf(
			/* translators: %d is a number of days. */
			_n( '%d day down', '%d days down', count( 'down' ), 'jetpack-protect-pkg' ),
			count( 'down' )
		),
		sprintf(
			/* translators: %d is a number of days. */
			_n(
				'%d day with no data',
				'%d days with no data',
				count( 'monitor_inactive' ),
				'jetpack-protect-pkg'
			),
			count( 'monitor_inactive' )
		)
	);

	const body = available
		? __(
				'Turn on downtime monitoring to get an email the moment your site goes down.',
				'jetpack-protect-pkg'
			)
		: __( 'Downtime monitoring isn’t available on this site.', 'jetpack-protect-pkg' );

	return (
		<ProtectCard
			icon={ seen }
			title={ __( 'Monitor', 'jetpack-protect-pkg' ) }
			status={ getStatus( available, active, connected, uptime, failed ) }
		>
			<CardRow>
				{ ! active && <Text variant="body-md">{ body }</Text> }
				{ active && (
					<Stack direction="column" gap="md">
						{ connected && (
							<Text variant="body-md">
								{ sprintf(
									/* translators: %d is a number of days. */
									__( 'Uptime, last %d days (UTC)', 'jetpack-protect-pkg' ),
									days?.length ?? monitor?.uptimeDays ?? 0
								) }
							</Text>
						) }
						{ ! connected && (
							<>
								<Text variant="body-md">
									{ __(
										'Your site is being monitored. Connect your WordPress.com account to see its uptime history.',
										'jetpack-protect-pkg'
									) }
								</Text>
								<Link href={ CONNECT_URL }>
									{ __( 'Connect your account', 'jetpack-protect-pkg' ) }
								</Link>
							</>
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
						{ connected && ! failed && days && (
							<>
								<div className="jp-protect-uptime" aria-hidden="true">
									{ days.map( day => (
										<span
											key={ day.date }
											className={ `jp-protect-uptime__bar is-${ day.status }` }
											title={ describeDay( day ) }
										/>
									) ) }
								</div>
								<Text variant="body-sm" className="jp-protect-card__muted">
									{ summary }
								</Text>
								<VisuallyHidden>
									<ul>
										{ days.map( day => (
											<li key={ day.date }>{ describeDay( day ) }</li>
										) ) }
									</ul>
								</VisuallyHidden>
							</>
						) }
					</Stack>
				) }
			</CardRow>
			{ available && (
				<CardRow>
					<TabLink tab="settings" onOpen={ openTab }>
						{ active
							? __( 'Configure Downtime Monitoring', 'jetpack-protect-pkg' )
							: __( 'Turn on in Settings', 'jetpack-protect-pkg' ) }
					</TabLink>
				</CardRow>
			) }
		</ProtectCard>
	);
}
