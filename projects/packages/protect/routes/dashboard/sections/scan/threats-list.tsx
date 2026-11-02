import { getThreatType, ThreatSeverityBadge, type Threat } from '@automattic/jetpack-scan';
import { DataViews, filterSortAndPaginate, type Field, type View } from '@wordpress/dataviews';
import { dateI18n } from '@wordpress/date';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { chevronDown } from '@wordpress/icons';
import { Collapsible, Icon, Spinner, Stack } from '@wordpress/ui';
import useArrowKeyNavigation from '../../components/use-arrow-key-navigation';
import { recordViewChange } from '../../data/threat-events';
import useOpenThreat from '../use-open-threat';
import { getThreatLabel } from './labels';
import { THREAT_PARAM, useSearchParam } from './store';
import { useThreatAction, type ThreatActionState } from './threat-actions';
import ThreatMedia from './threat-media';
import { useThreatRowActions } from './threat-row-actions';
import type { ScanThreat } from './types';

const DEFAULT_LAYOUTS = { table: {} };

/**
 * When a threat was found: "Today, 7:45 AM", else "Aug 15, 7:00 AM", in the site's timezone.
 *
 * @param date - The ISO date.
 * @return The formatted date.
 */
function formatDetected( date: string ): string {
	const time = dateI18n( 'g:i A', date, undefined );
	if ( dateI18n( 'Y-m-d', date, undefined ) === dateI18n( 'Y-m-d', new Date(), undefined ) ) {
		return sprintf(
			/* translators: %s is a time, such as "7:45 AM". */
			__( 'Today, %s', 'jetpack-protect-pkg' ),
			time
		);
	}
	return dateI18n( 'M j, g:i A', date, undefined );
}

type RowProps = { item: ScanThreat; onOpen: ( item: ScanThreat ) => void; inline?: boolean };

/**
 * The threat column: the icon and the threat, as one button that opens the details.
 *
 * Stacked, the kind of threat sits above what it's in; inline, they share a line with the severity.
 *
 * @param props        - Component props.
 * @param props.item   - The threat.
 * @param props.onOpen - Opens the threat in the inspector.
 * @param props.inline - Whether to show the threat on one line, with its severity.
 * @return The cell.
 */
function ThreatCell( { item, onOpen, inline = false }: RowProps ) {
	const { kind, subject } = getThreatLabel( item );
	const onClick = useCallback( () => onOpen( item ), [ item, onOpen ] );
	if ( inline ) {
		return (
			<span className="jp-protect-threats__row">
				<button type="button" className="jp-protect-threats__title is-inline" onClick={ onClick }>
					<ThreatMedia threat={ item } size={ 32 } />
					<span className="jp-protect-threats__label">
						{ kind && (
							<>
								<strong>
									{ sprintf(
										/* translators: %s is a kind of threat, such as "Vulnerable plugin", before what it's in. */
										__( '%s:', 'jetpack-protect-pkg' ),
										kind
									) }
								</strong>{ ' ' }
							</>
						) }
						{ subject }
					</span>
				</button>
				<ThreatSeverityBadge severity={ item.severity } />
			</span>
		);
	}
	return (
		<button
			type="button"
			className="jp-protect-threats__title"
			data-threat-id={ item.id }
			onClick={ onClick }
		>
			<ThreatMedia threat={ item } size={ 32 } />
			<span className="jp-protect-threats__label">
				{ kind ? <strong>{ kind }</strong> : subject }
				{ kind && <span className="jp-protect-card__muted">{ subject }</span> }
			</span>
		</button>
	);
}

/**
 * What a row says while an action runs on its threat.
 *
 * @param busy - The running action.
 * @return The status, such as "Fixing…".
 */
function getBusyLabel( busy: NonNullable< ThreatActionState[ 'busy' ] > ): string {
	switch ( busy ) {
		case 'fixing':
			return __( 'Fixing…', 'jetpack-protect-pkg' );
		case 'ignoring':
			return __( 'Ignoring…', 'jetpack-protect-pkg' );
		case 'unignoring':
			return __( 'Unignoring…', 'jetpack-protect-pkg' );
		case 'deleting':
			return __( 'Deleting…', 'jetpack-protect-pkg' );
	}
}

/**
 * The date column: the date, or what is happening to the threat while an action runs.
 *
 * @param props      - Component props.
 * @param props.item - The threat.
 * @param props.date - The ISO date.
 * @return The cell.
 */
function DateCell( { item, date }: { item: ScanThreat; date: string } ) {
	const { busy } = useThreatAction( item.id );
	if ( busy ) {
		return (
			<span className="jp-protect-threats__busy jp-protect-threats__nowrap">
				<Spinner />
				{ getBusyLabel( busy ) }
			</span>
		);
	}
	return date ? (
		<span className="jp-protect-card__muted jp-protect-threats__nowrap">
			{ formatDetected( date ) }
		</span>
	) : null;
}

type ThreatFieldOptions = {
	threatLabel: string;
	dateLabel: string;
	getDate: ( item: ScanThreat ) => string;
	/** Show each threat on one line, with its severity, for a list without a Severity column. */
	inline?: boolean;
};

/**
 * A threats table's columns: severity, the threat, then a date.
 *
 * @param open                - Opens a threat in the inspector.
 * @param options             - The columns' labels and date.
 * @param options.threatLabel - The threat column's heading.
 * @param options.dateLabel   - The date column's heading.
 * @param options.getDate     - The ISO date the date column shows.
 * @param options.inline      - Whether each threat takes one line, with its severity.
 * @return The fields.
 */
export function getThreatFields(
	open: ( item: ScanThreat ) => void,
	{ threatLabel, dateLabel, getDate, inline = false }: ThreatFieldOptions
): Field< ScanThreat >[] {
	return [
		{
			id: 'severity',
			label: __( 'Severity', 'jetpack-protect-pkg' ),
			type: 'integer',
			enableHiding: false,
			// Sorting only: a list's filter offers severity levels instead of raw numbers.
			filterBy: false,
			getValue: ( { item } ) => item.severity ?? 0,
			render: ( { item } ) => <ThreatSeverityBadge severity={ item.severity } />,
		},
		{
			id: 'threat',
			label: threatLabel,
			enableHiding: false,
			enableSorting: false,
			enableGlobalSearch: true,
			getValue: ( { item } ) => {
				const { kind, subject } = getThreatLabel( item );
				return kind ? `${ kind }: ${ subject }` : subject;
			},
			render: ( { item } ) => <ThreatCell item={ item } onOpen={ open } inline={ inline } />,
		},
		{
			id: 'date',
			label: dateLabel,
			type: 'datetime',
			enableHiding: false,
			getValue: ( { item } ) => getDate( item ),
			render: ( { item } ) => <DateCell item={ item } date={ getDate( item ) } />,
		},
	];
}

/**
 * A threats table's starting view.
 *
 * @param sortField - The column to sort by, descending.
 * @return The view.
 */
export function createThreatView( sortField: 'severity' | 'date' ): View {
	return {
		type: 'table',
		search: '',
		page: 1,
		perPage: 20,
		sort: { field: sortField, direction: 'desc' },
		fields: [ 'severity', 'threat', 'date' ],
		layout: {
			styles: {
				severity: { width: '1%', align: 'start' },
				threat: { width: '100%' },
				date: { width: '1%' },
			},
		},
	};
}

export const LEVELS = [
	{ value: 'critical', label: __( 'Critical', 'jetpack-protect-pkg' ) },
	{ value: 'high', label: __( 'High', 'jetpack-protect-pkg' ) },
	{ value: 'low', label: __( 'Low', 'jetpack-protect-pkg' ) },
];

const TYPES = [
	{ value: 'plugins', label: __( 'Plugin', 'jetpack-protect-pkg' ) },
	{ value: 'themes', label: __( 'Theme', 'jetpack-protect-pkg' ) },
	{ value: 'core', label: __( 'WordPress', 'jetpack-protect-pkg' ) },
	{ value: 'file', label: __( 'File', 'jetpack-protect-pkg' ) },
];

/**
 * A threat's severity level, matching the badge: Critical from 5, High from 3, else Low.
 *
 * @param item - The threat.
 * @return The level.
 */
export function getLevel( item: ScanThreat ): string {
	const severity = item.severity ?? 0;
	if ( severity >= 5 ) {
		return 'critical';
	}
	return severity >= 3 ? 'high' : 'low';
}

// Filters only; the row already shows both.
const FILTER_FIELDS: Field< ScanThreat >[] = [
	{
		id: 'level',
		label: __( 'Severity', 'jetpack-protect-pkg' ),
		elements: LEVELS,
		filterBy: { operators: [ 'isAny' ] },
		enableHiding: false,
		enableSorting: false,
		getValue: ( { item } ) => getLevel( item ),
	},
	{
		id: 'type',
		label: __( 'Type', 'jetpack-protect-pkg' ),
		elements: TYPES,
		filterBy: { operators: [ 'isAny' ] },
		enableHiding: false,
		enableSorting: false,
		getValue: ( { item } ) => getThreatType( item as Threat ) ?? '',
	},
];

const NO_SELECTION: string[] = [];

type ThreatsListProps = {
	threats: ScanThreat[];
	/** Whether the site's plan can fix and ignore threats. */
	canAct: boolean;
};

/**
 * The threats a scan found, under a heading that collapses them, with search, filters and bulk actions.
 *
 * Choosing a threat opens its details in the inspector.
 *
 * @param props         - Component props.
 * @param props.threats - The active threats.
 * @param props.canAct  - Whether the site can fix threats, which is what selecting rows is for.
 * @return The list.
 */
export default function ThreatsList( { threats, canAct }: ThreatsListProps ) {
	// As the title field, the threat column also names each row's checkbox.
	const [ view, setView ] = useState< View >( () => ( {
		...createThreatView( 'severity' ),
		titleField: 'threat',
		fields: [ 'date' ],
	} ) );
	const [ isOpen, setIsOpen ] = useState( true );
	const [ selection, setSelection ] = useState< string[] >( NO_SELECTION );

	const [ selected ] = useSearchParam( THREAT_PARAM );
	const open = useOpenThreat();
	const getItemId = useCallback( ( item: ScanThreat ) => String( item.id ), [] );

	// Threats that leave the list leave the selection, so Undo doesn't bring them back checked.
	useEffect( () => {
		setSelection( current => {
			const live = current.filter( id => threats.some( item => getItemId( item ) === id ) );
			return live.length === current.length ? current : live;
		} );
	}, [ threats, getItemId ] );
	const deselect = useCallback(
		( items: ScanThreat[] ) =>
			setSelection( current =>
				current.filter( id => ! items.some( item => getItemId( item ) === id ) )
			),
		[ getItemId ]
	);

	const fields = useMemo(
		() => [
			...getThreatFields( open, {
				threatLabel: __( 'Vulnerabilities', 'jetpack-protect-pkg' ),
				dateLabel: __( 'Detected on', 'jetpack-protect-pkg' ),
				getDate: item => item.firstDetected ?? '',
				inline: true,
			} ),
			...FILTER_FIELDS,
		],
		[ open ]
	);
	const actions = useThreatRowActions( open, canAct, deselect );

	const { data, paginationInfo } = useMemo(
		() => filterSortAndPaginate( threats, view, fields ),
		[ threats, view, fields ]
	);
	const { totalPages } = paginationInfo;
	const onChangeView = useCallback(
		( next: View ) => {
			recordViewChange( view, next, totalPages );
			setView( next );
		},
		[ view, totalPages ]
	);
	// Collapsed, the arrow keys would open threats the reader can't see.
	useArrowKeyNavigation( data, isOpen ? selected : undefined, getItemId, open );
	const hasSelectedRows = data.some( item => selection.includes( getItemId( item ) ) );

	return (
		<Collapsible.Root open={ isOpen } onOpenChange={ setIsOpen } className="jp-protect-threats">
			<h3 className="jp-protect-threats__heading">
				<Collapsible.Trigger className="jp-protect-threats__toggle">
					{ __( 'Review and fix threats', 'jetpack-protect-pkg' ) }
					<Icon icon={ chevronDown } size={ 24 } />
				</Collapsible.Trigger>
			</h3>
			<Collapsible.Panel>
				<DataViews
					data={ data }
					fields={ fields }
					actions={ actions }
					view={ view }
					onChangeView={ onChangeView }
					paginationInfo={ paginationInfo }
					defaultLayouts={ DEFAULT_LAYOUTS }
					getItemId={ getItemId }
					selection={ selection }
					onChangeSelection={ setSelection }
				>
					<Stack
						direction="row"
						align="center"
						justify="space-between"
						gap="xs"
						className="jp-protect-threats__toolbar"
					>
						<Stack direction="row" align="center" gap="sm">
							<DataViews.Search />
							<DataViews.FiltersToggle />
						</Stack>
						<DataViews.ViewConfig />
					</Stack>
					<DataViews.FiltersToggled className="jp-protect-threats__filters" />
					<DataViews.Layout />
					{ /* Only for bulk actions or more pages; otherwise it repeats the header's select all. */ }
					{ ( hasSelectedRows || paginationInfo.totalPages > 1 ) && <DataViews.Footer /> }
				</DataViews>
			</Collapsible.Panel>
		</Collapsible.Root>
	);
}
