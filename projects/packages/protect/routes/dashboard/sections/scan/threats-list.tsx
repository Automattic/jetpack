import { ThreatSeverityBadge } from '@automattic/jetpack-scan';
import { DataViews, filterSortAndPaginate, type Field, type View } from '@wordpress/dataviews';
import { dateI18n } from '@wordpress/date';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import useArrowKeyNavigation from '../../components/use-arrow-key-navigation';
import useOpenThreat from '../use-open-threat';
import { getThreatLabel } from './labels';
import { THREAT_PARAM, useSearchParam } from './store';
import ThreatMedia from './threat-media';
import { getThreatRowActions } from './threat-row-actions';
import type { ScanThreat } from './types';
import type { ReactNode } from 'react';

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

type RowProps = { item: ScanThreat; onOpen: ( item: ScanThreat ) => void };

/**
 * The threat column: the icon, the kind of threat and what it's in on a second line, as one button that opens the details.
 *
 * @param props        - Component props.
 * @param props.item   - The threat.
 * @param props.onOpen - Opens the threat in the inspector.
 * @return The cell.
 */
function ThreatCell( { item, onOpen }: RowProps ) {
	const { kind, subject } = getThreatLabel( item );
	const onClick = useCallback( () => onOpen( item ), [ item, onOpen ] );
	return (
		<button type="button" className="jp-protect-threats__title" onClick={ onClick }>
			<ThreatMedia threat={ item } size={ 32 } />
			<span className="jp-protect-threats__label">
				{ kind ? <strong>{ kind }</strong> : subject }
				{ kind && <span className="jp-protect-card__muted">{ subject }</span> }
			</span>
		</button>
	);
}

type ThreatFieldOptions = {
	threatLabel: string;
	dateLabel: string;
	getDate: ( item: ScanThreat ) => string;
};

/**
 * A threats table's columns: severity, the threat, then a date.
 *
 * @param open                - Opens a threat in the inspector.
 * @param options             - The columns' labels and date.
 * @param options.threatLabel - The threat column's heading.
 * @param options.dateLabel   - The date column's heading.
 * @param options.getDate     - The ISO date the date column shows.
 * @return The fields.
 */
export function getThreatFields(
	open: ( item: ScanThreat ) => void,
	{ threatLabel, dateLabel, getDate }: ThreatFieldOptions
): Field< ScanThreat >[] {
	return [
		{
			id: 'severity',
			label: __( 'Severity', 'jetpack-protect-pkg' ),
			type: 'integer',
			enableHiding: false,
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
			render: ( { item } ) => <ThreatCell item={ item } onOpen={ open } />,
		},
		{
			id: 'date',
			label: dateLabel,
			type: 'datetime',
			enableHiding: false,
			getValue: ( { item } ) => getDate( item ),
			render: ( { item } ) =>
				getDate( item ) ? (
					<span className="jp-protect-card__muted jp-protect-threats__nowrap">
						{ formatDetected( getDate( item ) ) }
					</span>
				) : null,
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

type ThreatsListProps = {
	threats: ScanThreat[];
	/** Shown when there are no active threats. */
	empty?: ReactNode;
	/** Whether the site's plan can fix and ignore threats. */
	canAct: boolean;
};

/**
 * The threats a scan found; choosing one opens its details in the inspector.
 *
 * @param props         - Component props.
 * @param props.threats - The active threats.
 * @param props.empty   - Shown when there are no active threats.
 * @param props.canAct  - Whether the site can fix threats.
 * @return The table.
 */
export default function ThreatsList( { threats, empty, canAct }: ThreatsListProps ) {
	const [ view, setView ] = useState< View >( () => createThreatView( 'severity' ) );

	const [ selected ] = useSearchParam( THREAT_PARAM );
	const selection = useMemo( () => ( selected ? [ selected ] : [] ), [ selected ] );
	const open = useOpenThreat();
	const getItemId = useCallback( ( item: ScanThreat ) => String( item.id ), [] );

	const fields = useMemo(
		() =>
			getThreatFields( open, {
				threatLabel: __( 'Threats', 'jetpack-protect-pkg' ),
				dateLabel: __( 'Detected on', 'jetpack-protect-pkg' ),
				getDate: item => item.firstDetected ?? '',
			} ),
		[ open ]
	);
	const actions = useMemo( () => getThreatRowActions( open, canAct ), [ open, canAct ] );

	const { data, paginationInfo } = useMemo(
		() => filterSortAndPaginate( threats, view, fields ),
		[ threats, view, fields ]
	);
	useArrowKeyNavigation( data, selected, getItemId, open );

	return (
		<div className="jp-protect-threats">
			<DataViews
				empty={ empty }
				data={ data }
				fields={ fields }
				actions={ actions }
				view={ view }
				onChangeView={ setView }
				paginationInfo={ paginationInfo }
				defaultLayouts={ DEFAULT_LAYOUTS }
				getItemId={ getItemId }
				selection={ selection }
			>
				<DataViews.Layout />
				<DataViews.Footer />
			</DataViews>
		</div>
	);
}
