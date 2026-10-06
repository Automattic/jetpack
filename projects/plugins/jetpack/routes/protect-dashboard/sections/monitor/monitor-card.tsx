import apiFetch from '@wordpress/api-fetch';
import { getSettings, gmdateI18n } from '@wordpress/date';
import { useEffect, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { seen } from '@wordpress/icons';
import { Skeleton, Stack, Text, VisuallyHidden } from '@wordpress/ui';
import { CardRow, ProtectCard } from '../../components/card';
import SettingsLink from '../../components/settings-link';
import isModuleActive from '../../data/is-module-active';
import type { MonitorContext, Uptime, UptimeDay } from './types';
import type { CardStatus } from '../../components/card';
import './style.scss';

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
		return sprintf( __( '%s: 100%% uptime', 'jetpack' ), date );
	}
	if ( day.status === 'down' ) {
		return sprintf(
			/* translators: %1$s is a date. %2$d is a number of minutes. */
			_n(
				'%1$s: down for %2$d minute',
				'%1$s: down for %2$d minutes',
				day.downtimeInMinutes,
				'jetpack'
			),
			date,
			day.downtimeInMinutes
		);
	}
	/* translators: %s is a date. */
	return sprintf( __( '%s: no data', 'jetpack' ), date );
}

/**
 * The card's badge.
 *
 * @param available - Whether Monitor can run on this site.
 * @param active    - Whether Monitor is on.
 * @param uptime    - The uptime response, once loaded.
 * @param failed    - Whether loading it failed.
 * @return The badge, if any.
 */
function getStatus(
	available: boolean,
	active: boolean,
	uptime: Uptime | null,
	failed: boolean
): CardStatus | undefined {
	if ( ! available ) {
		return { label: __( 'Unavailable', 'jetpack' ), intent: 'draft' };
	}
	if ( ! active ) {
		return { label: __( 'Off', 'jetpack' ), intent: 'draft' };
	}
	if ( uptime?.isUp === true ) {
		return { label: __( 'Operational', 'jetpack' ), intent: 'stable' };
	}
	if ( uptime?.isUp === false ) {
		return { label: __( 'Down', 'jetpack' ), intent: 'high' };
	}
	if ( uptime || failed ) {
		return { label: __( 'Status unknown', 'jetpack' ), intent: 'none' };
	}
	return undefined;
}

/**
 * The Monitor card: current status and daily uptime, one bar per day.
 *
 * @param props              - The dashboard context.
 * @param props.state        - The Monitor module's state from PHP.
 * @param props.settings     - Jetpack settings, for the module's live state.
 * @param props.openSettings - Opens the Settings tab.
 * @return The card.
 */
export default function MonitorCard( { state: monitor, settings, openSettings }: MonitorContext ) {
	const available = Boolean( monitor?.available );
	const active =
		available && isModuleActive( settings.settings, 'monitor', Boolean( monitor?.active ) );
	const [ uptime, setUptime ] = useState< Uptime | null >( null );
	const [ failed, setFailed ] = useState( false );

	useEffect( () => {
		if ( ! active ) {
			return;
		}
		let current = true;
		setUptime( null );
		setFailed( false );
		apiFetch< Uptime >( { path: '/jetpack/v4/protect-dashboard/uptime' } )
			.then( response => current && setUptime( response ) )
			.catch( () => current && setFailed( true ) );
		return () => {
			current = false;
		};
	}, [ active ] );

	const days = uptime?.days;
	const count = ( status: UptimeDay[ 'status' ] ) =>
		days?.filter( day => day.status === status ).length ?? 0;
	const summary = [
		/* translators: %d is a number of days. */
		sprintf( _n( '%d day up', '%d days up', count( 'up' ), 'jetpack' ), count( 'up' ) ),
		/* translators: %d is a number of days. */
		sprintf( _n( '%d day down', '%d days down', count( 'down' ), 'jetpack' ), count( 'down' ) ),
		sprintf(
			/* translators: %d is a number of days. */
			_n( '%d day with no data', '%d days with no data', count( 'monitor_inactive' ), 'jetpack' ),
			count( 'monitor_inactive' )
		),
	].join( ', ' );

	const body = available
		? __( 'Turn on downtime monitoring to get an email the moment your site goes down.', 'jetpack' )
		: __( 'Downtime monitoring isn’t available on this site.', 'jetpack' );

	return (
		<ProtectCard
			icon={ seen }
			title={ __( 'Monitor', 'jetpack' ) }
			status={ getStatus( available, active, uptime, failed ) }
		>
			<CardRow>
				{ ! active && <Text variant="body-md">{ body }</Text> }
				{ active && (
					<Stack direction="column" gap="md">
						<Text variant="body-md">
							{ sprintf(
								/* translators: %d is a number of days. */
								__( 'Uptime, last %d days (UTC)', 'jetpack' ),
								monitor?.uptimeDays ?? 0
							) }
						</Text>
						{ failed && (
							<Text variant="body-md">
								{ __( 'Uptime history is unavailable right now.', 'jetpack' ) }
							</Text>
						) }
						{ ! failed && ! days && <Skeleton className="jp-protect-uptime__skeleton" /> }
						{ ! failed && days && (
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
					<SettingsLink onOpen={ openSettings }>
						{ active
							? __( 'Configure Downtime Monitoring', 'jetpack' )
							: __( 'Turn on in Settings', 'jetpack' ) }
					</SettingsLink>
				</CardRow>
			) }
		</ProtectCard>
	);
}
