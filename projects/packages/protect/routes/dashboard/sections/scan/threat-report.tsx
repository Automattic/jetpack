import { Breadcrumbs } from '@wordpress/admin-ui';
import { DataViews, filterSortAndPaginate, type View } from '@wordpress/dataviews';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { caution, check, help, seen } from '@wordpress/icons';
import { Notice, Text } from '@wordpress/ui';
import { CardRow, ProtectCard, type CardStatus } from '../../components/card';
import useArrowKeyNavigation from '../../components/use-arrow-key-navigation';
import HistorySkeleton from '../history/history-skeleton';
import { HISTORY_THREAT_PARAM, loadHistory, useHistory } from '../history/store';
import useOpenThreat from '../use-open-threat';
import { groupThreats } from './group-threats';
import { THREAT_PARAM, useScan, useSearchParam } from './store';
import { getThreatRowActions } from './threat-row-actions';
import { getThreatFields } from './threats-list';
import type { ScanThreat } from './types';
import type { ReactElement } from 'react';
import '../history/style.scss';

const DEFAULT_LAYOUTS = { table: {} };
const NO_THREATS: ScanThreat[] = [];
// Unsorted, so the rows keep the order the link lists them in.
const VIEW: View = {
	type: 'table',
	search: '',
	page: 1,
	perPage: 50,
	fields: [ 'severity', 'threat', 'date' ],
	layout: {
		styles: {
			severity: { width: '1%', align: 'start' },
			threat: { width: '100%' },
			date: { width: '1%' },
		},
	},
};

const getId = ( item: ScanThreat ) => String( item.id );

/**
 * The trail above the report, whose first crumb goes back to the Overview.
 *
 * @return The breadcrumbs.
 */
export function ThreatReportBreadcrumbs() {
	return (
		<Breadcrumbs
			items={ [
				// "Protect" is a product name and is not translated.
				{ label: 'Protect', to: '/' },
				{ label: __( 'Threats from your alert', 'jetpack-protect-pkg' ) },
			] }
		/>
	);
}

type GroupProps = {
	icon: ReactElement;
	title: string;
	description: string;
	intent: CardStatus[ 'intent' ];
	threats: ScanThreat[];
	dateLabel: string;
	getDate: ( item: ScanThreat ) => string;
	canAct: boolean;
	selected: string | undefined;
};

/**
 * One group of the report's threats, as a card holding a Scan-style table.
 *
 * @param props             - Component props.
 * @param props.icon        - The card's icon.
 * @param props.title       - The group's name.
 * @param props.description - What the group means for the reader.
 * @param props.intent      - The count badge's intent.
 * @param props.threats     - The group's threats.
 * @param props.dateLabel   - The date column's heading.
 * @param props.getDate     - The ISO date the date column shows.
 * @param props.canAct      - Whether the site's plan can fix and ignore threats.
 * @param props.selected    - The threat open in an inspector, if any.
 * @return The card, or nothing for an empty group.
 */
function ThreatGroup( {
	icon,
	title,
	description,
	intent,
	threats,
	dateLabel,
	getDate,
	canAct,
	selected,
}: GroupProps ) {
	const [ view, setView ] = useState< View >( VIEW );
	const open = useOpenThreat();
	const fields = useMemo(
		() => getThreatFields( open, { threatLabel: title, dateLabel, getDate } ),
		[ open, title, dateLabel, getDate ]
	);
	const actions = useMemo( () => getThreatRowActions( open, canAct ), [ open, canAct ] );
	const { data, paginationInfo } = useMemo(
		() => filterSortAndPaginate( threats, view, fields ),
		[ threats, view, fields ]
	);
	const selection = useMemo( () => ( selected ? [ selected ] : [] ), [ selected ] );

	if ( ! threats.length ) {
		return null;
	}
	return (
		<ProtectCard
			icon={ icon }
			title={ title }
			description={ description }
			status={ { label: String( threats.length ), intent } }
		>
			<CardRow className="jp-protect-card__threats">
				<div className="jp-protect-threats">
					<DataViews
						data={ data }
						fields={ fields }
						actions={ actions }
						view={ view }
						onChangeView={ setView }
						paginationInfo={ paginationInfo }
						defaultLayouts={ DEFAULT_LAYOUTS }
						getItemId={ getId }
						selection={ selection }
					>
						<DataViews.Layout />
					</DataViews>
				</div>
			</CardRow>
		</ProtectCard>
	);
}

/**
 * Threats known only by id, such as ones Scan no longer reports.
 *
 * @param props             - Component props.
 * @param props.icon        - The card's icon.
 * @param props.title       - The group's name.
 * @param props.description - What the group means for the reader.
 * @param props.ids         - The threat ids.
 * @return The card, or nothing when there are none.
 */
function UnknownThreats( {
	icon,
	title,
	description,
	ids,
}: {
	icon: ReactElement;
	title: string;
	description: string;
	ids: string[];
} ) {
	if ( ! ids.length ) {
		return null;
	}
	return (
		<ProtectCard icon={ icon } title={ title } description={ description }>
			{ ids.map( id => (
				<CardRow key={ id }>
					<Text variant="body-md">
						{ sprintf(
							/* translators: %s is a threat's id number. */
							__( 'Threat #%s', 'jetpack-protect-pkg' ),
							id
						) }
					</Text>
				</CardRow>
			) ) }
		</ProtectCard>
	);
}

/**
 * The line that tells the reader what to do next.
 *
 * @param active   - How many of the threats need attention.
 * @param total    - How many threats the link lists.
 * @param checking - Whether some statuses are still loading.
 * @return The summary, or an empty string while there's nothing to say yet.
 */
function getSummary( active: number, total: number, checking: boolean ): string {
	if ( active ) {
		return total === 1
			? __( 'This threat needs your attention.', 'jetpack-protect-pkg' )
			: sprintf(
					/* translators: %1$d is a number of threats needing attention, %2$d is the number of threats in the alert. */
					_n(
						'%1$d of %2$d threats needs your attention.',
						'%1$d of %2$d threats need your attention.',
						active,
						'jetpack-protect-pkg'
					),
					active,
					total
				);
	}
	if ( checking ) {
		return '';
	}
	return total === 1
		? __( 'This threat no longer needs your attention.', 'jetpack-protect-pkg' )
		: __( 'None of the threats from this alert need your attention.', 'jetpack-protect-pkg' );
}

const getDetected = ( item: ScanThreat ) => item.firstDetected ?? '';
const getFixed = ( item: ScanThreat ) => item.fixedOn ?? '';

/**
 * The threats a link names, such as the ones in a threat email, grouped by what Scan has done with them.
 *
 * @param props     - Component props.
 * @param props.ids - The threat ids from the link.
 * @return The report.
 */
export default function ThreatReport( { ids }: { ids: string[] } ) {
	const scan = useScan();
	const history = useHistory();
	const active = scan?.threats ?? NO_THREATS;
	const canAct = Boolean( scan?.hasPlan );
	// History is fetched only where its section says the plan has it.
	const hasHistory = Boolean(
		( window.jetpackProtectDashboard?.history as { hasPlan?: boolean } | undefined )?.hasPlan
	);
	const [ refreshing, setRefreshing ] = useState( hasHistory );

	// A fix moves its threat out of the active list but not into history, so reload history then.
	const activeKey = active.map( getId ).join( ',' );
	useEffect( () => {
		if ( ! hasHistory ) {
			return;
		}
		let live = true;
		setRefreshing( true );
		loadHistory( true ).finally( () => live && setRefreshing( false ) );
		return () => {
			live = false;
		};
	}, [ activeKey, hasHistory ] );

	let known: ScanThreat[] | null = NO_THREATS;
	if ( hasHistory ) {
		known = refreshing || history.error ? null : history.threats;
	}
	const groups = useMemo(
		() => groupThreats( ids, { active, ignored: scan?.ignored, history: known } ),
		[ ids, active, scan?.ignored, known ]
	);

	const [ threatParam ] = useSearchParam( THREAT_PARAM );
	const [ historyParam ] = useSearchParam( HISTORY_THREAT_PARAM );
	const selected = threatParam ?? historyParam;
	const open = useOpenThreat();
	const rows = useMemo(
		() => [ ...groups.active, ...groups.fixed, ...groups.ignored ],
		[ groups ]
	);
	const getItemId = useCallback( getId, [] );
	useArrowKeyNavigation( rows, selected, getItemId, open );

	const failed = Boolean( history.error ) && ! refreshing;
	const summary = getSummary( groups.active.length, ids.length, groups.pending.length > 0 );

	return (
		<div className="jp-protect-dashboard__cards">
			{ summary && (
				<Notice.Root intent={ groups.active.length ? 'warning' : 'success' }>
					<Notice.Description>{ summary }</Notice.Description>
				</Notice.Root>
			) }
			{ failed && (
				<Notice.Root intent="error">
					<Notice.Description>{ history.error }</Notice.Description>
				</Notice.Root>
			) }
			<ThreatGroup
				icon={ caution }
				title={ __( 'Needs attention', 'jetpack-protect-pkg' ) }
				description={ __(
					'Scan still finds these. Fix them, or open one to see how.',
					'jetpack-protect-pkg'
				) }
				intent="high"
				threats={ groups.active }
				dateLabel={ __( 'Detected on', 'jetpack-protect-pkg' ) }
				getDate={ getDetected }
				canAct={ canAct }
				selected={ selected }
			/>
			{ groups.pending.length > 0 && ! failed && (
				<ProtectCard icon={ help } title={ __( 'Checking status', 'jetpack-protect-pkg' ) }>
					<CardRow className="jp-protect-card__threats">
						<HistorySkeleton rows={ groups.pending.length } showFilter={ false } />
					</CardRow>
				</ProtectCard>
			) }
			<ThreatGroup
				icon={ check }
				title={ __( 'Fixed', 'jetpack-protect-pkg' ) }
				description={ __(
					'These are taken care of. There’s nothing to do.',
					'jetpack-protect-pkg'
				) }
				intent="stable"
				threats={ groups.fixed }
				dateLabel={ __( 'Fixed on', 'jetpack-protect-pkg' ) }
				getDate={ getFixed }
				canAct={ canAct }
				selected={ selected }
			/>
			<ThreatGroup
				icon={ seen }
				title={ __( 'Ignored', 'jetpack-protect-pkg' ) }
				description={ __(
					'Someone chose to ignore these. Unignore one to have Scan report it again.',
					'jetpack-protect-pkg'
				) }
				intent="none"
				threats={ groups.ignored }
				dateLabel={ __( 'Detected on', 'jetpack-protect-pkg' ) }
				getDate={ getDetected }
				canAct={ canAct }
				selected={ selected }
			/>
			<UnknownThreats
				icon={ check }
				title={ __( 'No longer detected', 'jetpack-protect-pkg' ) }
				description={ __(
					'Scan no longer finds these, for example after the plugin or theme was updated or removed.',
					'jetpack-protect-pkg'
				) }
				ids={ groups.notFound }
			/>
			{ failed && (
				<UnknownThreats
					icon={ help }
					title={ __( 'Status unavailable', 'jetpack-protect-pkg' ) }
					description={ __(
						'These couldn’t be checked right now. Reload the page to try again.',
						'jetpack-protect-pkg'
					) }
					ids={ groups.pending }
				/>
			) }
		</div>
	);
}
