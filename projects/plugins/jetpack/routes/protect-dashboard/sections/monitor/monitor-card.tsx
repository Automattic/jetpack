import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { seen } from '@wordpress/icons';
import { Skeleton, Stack, Text } from '@wordpress/ui';
import { CardRow, ProtectCard } from '../../components/card';
import SettingsLink from '../../components/settings-link';
import isModuleActive from '../../data/is-module-active';
import type { CardStatus } from '../../components/card';
import type { DashboardContext } from '../types';
import type { MonitorState, UptimeDay } from './types';
import './style.scss';

/**
 * Tooltip text for one day's bar.
 *
 * @param day - The day.
 * @return The text.
 */
function describeDay( day: UptimeDay ): string {
	if ( day.status === 'up' ) {
		/* translators: %s is a date, such as 2026-10-05. */
		return sprintf( __( '%s: 100%% uptime', 'jetpack' ), day.date );
	}
	if ( day.status === 'down' ) {
		return sprintf(
			/* translators: %1$s is a date, such as 2026-10-05. %2$d is a number of minutes. */
			_n(
				'%1$s: down for %2$d minute',
				'%1$s: down for %2$d minutes',
				day.downtimeInMinutes,
				'jetpack'
			),
			day.date,
			day.downtimeInMinutes
		);
	}
	/* translators: %s is a date, such as 2026-10-05. */
	return sprintf( __( '%s: no data', 'jetpack' ), day.date );
}

/**
 * The Monitor card: the last 40 days of uptime, one bar per day.
 *
 * @param props              - The dashboard context.
 * @param props.state        - The Monitor module's state from PHP.
 * @param props.settings     - Jetpack settings, for the module's live state.
 * @param props.openSettings - Opens the Settings tab.
 * @return The card.
 */
export default function MonitorCard( { state, settings, openSettings }: DashboardContext ) {
	const monitor = state as MonitorState | undefined;
	const active = isModuleActive( settings.settings, 'monitor', Boolean( monitor?.active ) );
	const [ days, setDays ] = useState< UptimeDay[] | null >( null );
	const [ failed, setFailed ] = useState( false );

	useEffect( () => {
		if ( ! active ) {
			return;
		}
		setFailed( false );
		apiFetch< UptimeDay[] >( { path: '/jetpack/v4/protect-dashboard/uptime' } )
			.then( setDays )
			.catch( () => setFailed( true ) );
	}, [ active ] );

	const today = days?.[ days.length - 1 ];
	let status: CardStatus | undefined;
	if ( ! active ) {
		status = { label: __( 'Off', 'jetpack' ), intent: 'draft' };
	} else if ( today?.status === 'down' ) {
		status = { label: __( 'Down', 'jetpack' ), intent: 'high' };
	} else if ( today?.status === 'up' ) {
		status = { label: __( 'Operational', 'jetpack' ), intent: 'stable' };
	}

	const upDays = days?.filter( day => day.status === 'up' ).length ?? 0;

	return (
		<ProtectCard icon={ seen } title={ __( 'Monitor', 'jetpack' ) } status={ status }>
			<CardRow>
				{ ! active && (
					<Text variant="body-md">
						{ __(
							'Turn on downtime monitoring to get an email the moment your site goes down.',
							'jetpack'
						) }
					</Text>
				) }
				{ active && (
					<Stack direction="column" gap="md">
						<Text variant="body-md">
							{ sprintf(
								/* translators: %d is a number of days. */
								__( 'Last %d days uptime', 'jetpack' ),
								days?.length || 40
							) }
						</Text>
						{ failed && (
							<Text variant="body-md">
								{ __( 'Uptime history is unavailable right now.', 'jetpack' ) }
							</Text>
						) }
						{ ! failed && ! days && <Skeleton className="jp-protect-uptime__skeleton" /> }
						{ ! failed && days && (
							<div
								className="jp-protect-uptime"
								role="img"
								aria-label={ sprintf(
									/* translators: %1$d is days with full uptime, %2$d the days shown. */
									__( 'Up all day on %1$d of the last %2$d days', 'jetpack' ),
									upDays,
									days.length
								) }
							>
								{ days.map( day => (
									<span
										key={ day.date }
										className={ `jp-protect-uptime__bar is-${ day.status }` }
										title={ describeDay( day ) }
									/>
								) ) }
							</div>
						) }
					</Stack>
				) }
			</CardRow>
			<CardRow>
				<SettingsLink onOpen={ openSettings }>
					{ active
						? __( 'Configure Downtime Monitoring', 'jetpack' )
						: __( 'Turn on in Settings', 'jetpack' ) }
				</SettingsLink>
			</CardRow>
		</ProtectCard>
	);
}
