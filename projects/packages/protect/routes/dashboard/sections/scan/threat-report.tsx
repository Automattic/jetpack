import { Breadcrumbs } from '@wordpress/admin-ui';
import { DataViews, filterSortAndPaginate, type View } from '@wordpress/dataviews';
import { useCallback, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { check, help, seen } from '@wordpress/icons';
import { Card, Notice, Stack, Text } from '@wordpress/ui';
import { CardRow, ProtectCard, type CardStatus } from '../../components/card';
import useArrowKeyNavigation from '../../components/use-arrow-key-navigation';
import { HISTORY_THREAT_PARAM, loadHistory, useHistory } from '../history/store';
import useOpenThreat from '../use-open-threat';
import { groupThreats } from './group-threats';
import { SafeShield } from './safe-state';
import { THREAT_PARAM, useScan, useSearchParam } from './store';
import { getThreatRowActions } from './threat-row-actions';
import threatsIcon from './threats-icon';
import { getThreatFields } from './threats-list';
import type { ScanThreat } from './types';
import type { ReactElement } from 'react';

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
 * The Scan tab's safe state, shown above the report once none of its threats need attention.
 *
 * @param props            - Component props.
 * @param props.siteIsSafe - Whether Scan finds no other threats on the site either.
 * @return The section.
 */
function ReportSafeState( { siteIsSafe }: { siteIsSafe: boolean } ) {
	const title = siteIsSafe
		? __( 'Your site is safe right now', 'jetpack-protect-pkg' )
		: __( 'Nothing from your alert needs fixing', 'jetpack-protect-pkg' );
	return (
		<Card.Root render={ <section /> } className="jp-protect-card" aria-label={ title }>
			<Card.Content>
				<Stack className="jp-protect-safe" direction="column" align="center" gap="md">
					<SafeShield />
					<Text variant="heading-xl" render={ <h3 /> }>
						{ title }
					</Text>
					<Text variant="body-lg" className="jp-protect-safe__details">
						{ siteIsSafe
							? __(
									'None of the threats from your alert need your attention.',
									'jetpack-protect-pkg'
								)
							: __(
									'Scan found other threats on your site. See them on the Overview.',
									'jetpack-protect-pkg'
								) }
					</Text>
				</Stack>
			</Card.Content>
		</Card.Root>
	);
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

	const reload = useCallback( () => {
		setRefreshing( true );
		loadHistory( true ).finally( () => setRefreshing( false ) );
	}, [] );
	useEffect( () => {
		if ( hasHistory ) {
			reload();
		}
	}, [ hasHistory, reload ] );

	// A fix moves its threat out of the active list but not into history, so reload history then; ignoring needs no reload.
	const lastActive = useRef( active );
	useEffect( () => {
		const still = new Set( [ ...active, ...( scan?.ignored ?? [] ) ].map( getId ) );
		const left = lastActive.current.some(
			item => ids.includes( getId( item ) ) && ! still.has( getId( item ) )
		);
		lastActive.current = active;
		if ( hasHistory && left ) {
			reload();
		}
	}, [ active, scan?.ignored, ids, hasHistory, reload ] );

	let known: ScanThreat[] | null = NO_THREATS;
	if ( hasHistory ) {
		known = history.error ? null : history.threats;
	}
	const groups = useMemo(
		() => groupThreats( ids, { active, ignored: scan?.ignored, history: known } ),
		[ ids, active, scan?.ignored, known ]
	);
	// While history reloads, an id missing from the last copy may be a threat just fixed.
	const notFound = refreshing ? [] : groups.notFound;
	const pending = refreshing ? [ ...groups.pending, ...groups.notFound ] : groups.pending;

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

	const isClear = ! groups.active.length && ! pending.length;

	return (
		<div className="jp-protect-dashboard__cards">
			{ isClear && <ReportSafeState siteIsSafe={ ! active.length } /> }
			{ pending.length > 0 && ! failed && (
				<Notice.Root intent="info">
					<Notice.Description>
						{ sprintf(
							/* translators: %d is a number of threats. */
							_n(
								'Checking the latest status of %d threat…',
								'Checking the latest status of %d threats…',
								pending.length,
								'jetpack-protect-pkg'
							),
							pending.length
						) }
					</Notice.Description>
				</Notice.Root>
			) }
			{ failed && (
				<Notice.Root intent="error">
					<Notice.Description>{ history.error }</Notice.Description>
				</Notice.Root>
			) }
			<ThreatGroup
				icon={ threatsIcon }
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
				ids={ notFound }
			/>
			{ failed && (
				<UnknownThreats
					icon={ help }
					title={ __( 'Status unavailable', 'jetpack-protect-pkg' ) }
					description={ __(
						'These couldn’t be checked right now. Reload the page to try again.',
						'jetpack-protect-pkg'
					) }
					ids={ pending }
				/>
			) }
		</div>
	);
}
