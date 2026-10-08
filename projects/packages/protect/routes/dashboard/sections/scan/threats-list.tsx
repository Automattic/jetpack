import { ThreatSeverityBadge } from '@automattic/jetpack-scan';
import { DataViews, filterSortAndPaginate, type Field, type View } from '@wordpress/dataviews';
import { dateI18n } from '@wordpress/date';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Button, Stack } from '@wordpress/ui';
import { getThreatLabel } from './labels';
import { useThreatParam } from './store';
import { useThreatAction } from './threat-actions';
import ThreatMedia from './threat-media';
import type { ScanThreat } from './types';
import type { ReactNode } from 'react';

const DEFAULT_LAYOUTS = { table: {} };

/**
 * When a threat was found: "Today, 7:45 AM", else "Aug 15, 7:00 AM", in the site's timezone.
 *
 * @param date - The ISO date.
 * @return The formatted date.
 */
export function formatDetected( date: string ): string {
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

export type RowProps = { item: ScanThreat; onOpen: ( item: ScanThreat ) => void };
/** Whether the site's plan can fix and ignore threats; the free vulnerability check can't. */
type ActionProps = RowProps & { canAct: boolean };

/**
 * The threat column: the icon and title, as one button that opens the details.
 *
 * @param props        - Component props.
 * @param props.item   - The threat.
 * @param props.onOpen - Opens the threat in the inspector.
 * @return The cell.
 */
export function ThreatCell( { item, onOpen }: RowProps ) {
	const { kind, subject } = getThreatLabel( item );
	const onClick = useCallback( () => onOpen( item ), [ item, onOpen ] );
	return (
		<button type="button" className="jp-protect-threats__title" onClick={ onClick }>
			<ThreatMedia threat={ item } size={ 32 } />
			<span>
				{ kind && <strong>{ kind }: </strong> }
				{ subject }
			</span>
		</button>
	);
}

/**
 * The actions column: Auto-fix when a fix exists, then View; both open the details.
 *
 * @param props        - Component props.
 * @param props.item   - The threat.
 * @param props.onOpen - Opens the threat in the inspector.
 * @param props.canAct - Whether the site can fix threats.
 * @return The cell.
 */
export function ActionsCell( { item, onOpen, canAct }: ActionProps ) {
	const onClick = useCallback( () => onOpen( item ), [ item, onOpen ] );
	const { busy } = useThreatAction( item.id );
	return (
		<Stack direction="row" gap="xs" align="center" justify="end">
			{ /* While a fix runs, a snackbar reports it; hiding Auto-fix stops a second request. */ }
			{ canAct && item.fixable && item.status !== 'ignored' && busy !== 'fixing' && (
				<Button variant="outline" size="compact" onClick={ onClick }>
					{ __( 'Auto-fix', 'jetpack-protect-pkg' ) }
				</Button>
			) }
			<Button variant="outline" tone="neutral" size="compact" onClick={ onClick }>
				{ __( 'View', 'jetpack-protect-pkg' ) }
			</Button>
		</Stack>
	);
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
	const [ view, setView ] = useState< View >( {
		type: 'table',
		search: '',
		page: 1,
		perPage: 20,
		sort: { field: 'severity', direction: 'desc' },
		fields: [ 'severity', 'threat', 'firstDetected', 'actions' ],
		layout: {
			styles: {
				severity: { width: '1%', align: 'start' },
				threat: { width: '100%' },
				firstDetected: { width: '1%' },
				actions: { width: '1%', align: 'end' },
			},
		},
	} );

	const [ selected, setThreat ] = useThreatParam();
	const selection = useMemo( () => ( selected ? [ selected ] : [] ), [ selected ] );
	const open = useCallback( ( item: ScanThreat ) => setThreat( item.id ), [ setThreat ] );
	const getItemId = useCallback( ( item: ScanThreat ) => String( item.id ), [] );

	const fields = useMemo< Field< ScanThreat >[] >(
		() => [
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
				label: __( 'Threats', 'jetpack-protect-pkg' ),
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
				id: 'firstDetected',
				label: __( 'Detected on', 'jetpack-protect-pkg' ),
				type: 'datetime',
				enableHiding: false,
				getValue: ( { item } ) => item.firstDetected ?? '',
				render: ( { item } ) =>
					item.firstDetected ? (
						<span className="jp-protect-card__muted jp-protect-threats__nowrap">
							{ formatDetected( item.firstDetected ) }
						</span>
					) : null,
			},
			{
				id: 'actions',
				label: __( 'Actions', 'jetpack-protect-pkg' ),
				enableHiding: false,
				enableSorting: false,
				render: ( { item } ) => <ActionsCell item={ item } onOpen={ open } canAct={ canAct } />,
			},
		],
		[ open, canAct ]
	);

	const { data, paginationInfo } = useMemo(
		() => filterSortAndPaginate( threats, view, fields ),
		[ threats, view, fields ]
	);

	return (
		<div className="jp-protect-threats">
			<DataViews
				empty={ empty }
				data={ data }
				fields={ fields }
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
