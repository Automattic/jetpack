import { speak } from '@wordpress/a11y';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useNavigate, useSearch } from '@wordpress/route';
import { errorMessage, fetchLog } from '../../../data/api';
import { addDays, siteToday } from '../../../data/dates';
import { DEFAULT_STATS_PERIOD, parsePeriod, periodKey, periodLabel } from '../../../data/period';
import { useLogVersion, useStats } from '../../../data/store';
import { useTestEmail } from '../setup/use-test-email';
import ActivityCard from './activity-card';
import {
	attentionFor,
	dashboardState,
	newestTime,
	periodHref,
	statsPeriod,
} from './dashboard-state';
import RecentEmails from './recent-emails';
import StatusRow from './status-row';
import TopOrigins from './top-origins';
import type { Account, LogRow, Period, SendStatus } from '../../../data/types';
import './dashboard.scss';

/** What sends the most shows from this many sources. */
const MIN_ORIGINS = 2;

/** The longest custom range the dashboard counts, in days. */
const MAX_RANGE_DAYS = 365;

/** How far back the counts go, in days, so the calendar offers nothing older. */
const COUNTS_KEEP_DAYS = 800;

type Props = {
	status: SendStatus;
	account: Account;
};

/**
 * Re-render every half minute so "12 min ago" stays true.
 *
 * @return The current time in ms.
 */
function useNow(): number {
	const [ now, setNow ] = useState( () => Date.now() );
	useEffect( () => {
		const id = window.setInterval( () => setNow( Date.now() ), 30000 );
		return () => window.clearInterval( id );
	}, [] );
	return now;
}

/**
 * The last five emails from the Log, loaded again whenever this page logs one (a test, say).
 * The rows on screen stay until the new ones land.
 *
 * @return Rows (null while loading) and the load error.
 */
function useRecentEmails() {
	const logVersion = useLogVersion();
	const [ rows, setRows ] = useState< LogRow[] | null >( null );
	const [ error, setError ] = useState< string | null >( null );
	useEffect( () => {
		let cancelled = false;
		fetchLog( { page: 1, per_page: 5 } )
			.then( page => {
				if ( ! cancelled ) {
					setRows( page.items );
					setError( null );
				}
			} )
			.catch( e => ! cancelled && setError( errorMessage( e ) ) );
		return () => {
			cancelled = true;
		};
	}, [ logVersion ] );
	return { rows, error };
}

/**
 * What the dashboard says once a new period's numbers are on screen.
 *
 * @param period - The period.
 * @return "Showing the last 90 days.", or "Showing Sep 1 – Oct 19."
 */
function showingText( period: Period ): string {
	if ( ! ( 'range' in period ) ) {
		/* translators: %s: the dates shown, e.g. "Sep 1 – Oct 19". */
		return sprintf( __( 'Showing %s.', 'jetpack-send-pkg' ), periodLabel( period ) );
	}
	if ( period.range === 1 ) {
		return __( 'Showing the last 24 hours.', 'jetpack-send-pkg' );
	}
	return sprintf(
		/* translators: %d: number of days. */
		_n( 'Showing the last %d day.', 'Showing the last %d days.', period.range, 'jetpack-send-pkg' ),
		period.range
	);
}

/**
 * The first day the calendar offers: the site's first counted day, but no further back than the
 * counts are kept; today when nothing was counted.
 *
 * @param since - The stats' `stats_since`, or undefined before they load.
 * @return Site-local `Y-m-d`.
 */
function earliestDay( since: string | null | undefined ): string {
	const today = siteToday();
	const floor = addDays( today, 1 - COUNTS_KEEP_DAYS );
	if ( since === undefined ) {
		return floor;
	}
	if ( since === null ) {
		return today;
	}
	return since > floor ? since : floor;
}

/**
 * Send › Overview once setup is finished: status and usage, then email activity, recent emails
 * and what sends the most.
 *
 * @param props         - Component props.
 * @param props.status  - Send status.
 * @param props.account - The sending account.
 * @return The dashboard.
 */
const Dashboard = ( { status, account }: Props ) => {
	const navigate = useNavigate();
	const search = useSearch( { strict: false } ) as Record< string, unknown > | undefined;
	const period =
		parsePeriod( search, DEFAULT_STATS_PERIOD, { maxDays: MAX_RANGE_DAYS } ) ??
		DEFAULT_STATS_PERIOD;
	const requestedKey = periodKey( period );

	const { stats, error, retry, refreshing } = useStats( period );
	const testSentAt = status.onboarding.test_sent_at;
	const recent = useRecentEmails();
	const now = useNow();
	const state = dashboardState( { stats, error, testSentAt, hasHistory: status.has_history } );
	const devMode = status.provisioner === 'local';
	const attention = stats
		? attentionFor( stats, ! status.can_enable, ! status.settings.enabled )
		: null;
	const { state: testState, send: sendTestEmail } = useTestEmail( account.domain, devMode );
	const sendTest = useCallback( () => void sendTestEmail(), [ sendTestEmail ] );
	const hasHistory = !! ( status.has_history || stats?.has_history );

	// Once a picked period's numbers land, say so; the button keeps focus the whole time.
	const announce = useRef< Period | null >( null );
	const onPeriodChange = useCallback(
		( next: Period ) => {
			announce.current = next;
			navigate( { href: periodHref( next ) } );
		},
		[ navigate ]
	);
	useEffect( () => {
		const picked = announce.current;
		if ( picked && stats && ! refreshing && periodKey( picked ) === requestedKey ) {
			announce.current = null;
			speak( showingText( picked ) );
		}
	}, [ stats, refreshing, requestedKey ] );

	const loading = state === 'loading';
	const origins = state === 'normal' && stats ? stats.origins : [];
	// With nothing logged, Email activity already says "No emails yet.", so this card isn't shown.
	const showRecent =
		!! recent.error || ( recent.rows ? recent.rows.length > 0 || hasHistory : state !== 'no-data' );
	// One source isn't a ranking, so the card waits for a second (and for the stats to say so).
	const showOrigins = origins.length >= MIN_ORIGINS;

	return (
		<div className="jetpack-send-dashboard">
			<StatusRow
				status={ status }
				account={ account }
				// Recent emails includes tests, so a test just sent doesn't read as "7 hours ago".
				lastEmailAt={ newestTime(
					stats?.last_email_at ?? null,
					recent.rows?.[ 0 ]?.created_at ?? null
				) }
				lastEmailDay={ stats?.last_email_day ?? null }
				statsLoading={ ! stats && ! error }
				// With nothing logged the empty activity card offers it, so wait for the stats to say.
				offerTest={ state !== 'no-data' && ! loading }
			/>
			<ActivityCard
				state={ state }
				stats={ stats }
				error={ error }
				attention={ attention }
				period={ period }
				onPeriodChange={ onPeriodChange }
				earliest={ earliestDay( stats ? stats.stats_since : undefined ) }
				showRange={ hasHistory }
				refreshing={ refreshing }
				onRetry={ retry }
				paused={ ! status.settings.enabled }
				canEnable={ status.can_enable }
				onSendTest={ sendTest }
				sendingTest={ testState.phase === 'sending' }
			/>
			{ ( showRecent || showOrigins ) && (
				<div className="jetpack-send-dashboard__row">
					{ showRecent && (
						<div className="jetpack-send-dashboard__main">
							<RecentEmails
								rows={ recent.rows }
								error={ recent.error }
								now={ now }
								domain={ account.domain }
								siteTitle={ status.site_title }
								devMode={ devMode }
								hasHistory={ hasHistory }
								retentionDays={ status.log_retention_days }
							/>
						</div>
					) }
					{ showOrigins && stats && (
						<div className="jetpack-send-dashboard__side">
							<TopOrigins origins={ origins } period={ statsPeriod( stats ) } />
						</div>
					) }
				</div>
			) }
		</div>
	);
};

export default Dashboard;
