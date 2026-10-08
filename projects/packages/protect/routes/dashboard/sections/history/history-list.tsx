import { ThreatSeverityBadge } from '@automattic/jetpack-scan';
import { DataViews, filterSortAndPaginate, type Field, type View } from '@wordpress/dataviews';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Tabs } from '@wordpress/ui';
import { getThreatLabel } from '../scan/labels';
import { useThreatParam } from '../scan/store';
import { ActionsCell, ThreatCell, formatDetected } from '../scan/threats-list';
import { HISTORY_THREAT_PARAM } from './store';
import type { ScanThreat } from '../scan/types';

const DEFAULT_LAYOUTS = { table: {} };

type Status = 'fixed' | 'ignored';

/**
 * When a threat was fixed, or for an ignored one, when it was found.
 *
 * @param item - The threat.
 * @return The ISO date, or an empty string.
 */
const getDate = ( item: ScanThreat ) =>
	( item.status === 'fixed' ? item.fixedOn : item.firstDetected ) ?? '';

/**
 * Fixed and ignored threats, laid out like the Scan list; choosing one opens its details.
 *
 * @param props         - Component props.
 * @param props.threats - Every threat in Scan history.
 * @return The table.
 */
export default function HistoryList( { threats }: { threats: ScanThreat[] } ) {
	const fixed = useMemo( () => threats.filter( item => item.status === 'fixed' ), [ threats ] );
	const ignored = useMemo( () => threats.filter( item => item.status === 'ignored' ), [ threats ] );
	const [ status, setStatus ] = useState< Status >(
		fixed.length || ! ignored.length ? 'fixed' : 'ignored'
	);
	const [ view, setView ] = useState< View >( {
		type: 'table',
		search: '',
		page: 1,
		perPage: 20,
		sort: { field: 'date', direction: 'desc' },
		fields: [ 'severity', 'threat', 'date', 'actions' ],
		layout: {
			styles: {
				severity: { width: '1%', align: 'start' },
				threat: { width: '100%' },
				date: { width: '1%' },
				actions: { width: '1%', align: 'end' },
			},
		},
	} );

	const onStatusChange = useCallback( ( value: unknown ) => {
		setStatus( value === 'ignored' ? 'ignored' : 'fixed' );
		setView( current => ( { ...current, page: 1 } ) );
	}, [] );
	const [ selected, setThreat ] = useThreatParam( HISTORY_THREAT_PARAM );
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
				id: 'date',
				label:
					status === 'fixed'
						? __( 'Fixed on', 'jetpack-protect-pkg' )
						: __( 'Detected on', 'jetpack-protect-pkg' ),
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
			{
				id: 'actions',
				label: __( 'Actions', 'jetpack-protect-pkg' ),
				enableHiding: false,
				enableSorting: false,
				render: ( { item } ) => <ActionsCell item={ item } onOpen={ open } canAct={ false } />,
			},
		],
		[ open, status ]
	);

	const { data, paginationInfo } = useMemo(
		() => filterSortAndPaginate( status === 'fixed' ? fixed : ignored, view, fields ),
		[ status, fixed, ignored, view, fields ]
	);

	return (
		<div className="jp-protect-threats">
			<div className="jp-protect-threats__filter">
				<Tabs.Root value={ status } onValueChange={ onStatusChange }>
					<Tabs.List variant="minimal">
						<Tabs.Tab value="fixed">
							{ sprintf(
								/* translators: %d is a number of threats. */
								__( 'Fixed (%d)', 'jetpack-protect-pkg' ),
								fixed.length
							) }
						</Tabs.Tab>
						<Tabs.Tab value="ignored">
							{ sprintf(
								/* translators: %d is a number of threats. */
								__( 'Ignored (%d)', 'jetpack-protect-pkg' ),
								ignored.length
							) }
						</Tabs.Tab>
					</Tabs.List>
				</Tabs.Root>
			</div>
			<DataViews
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
