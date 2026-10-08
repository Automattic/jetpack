import { ThreatSeverityBadge } from '@automattic/jetpack-scan';
import { DataViews, filterSortAndPaginate, type Field, type View } from '@wordpress/dataviews';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';
import { Tabs } from '@wordpress/ui';
import { getThreatLabel } from '../scan/labels';
import { THREAT_PARAM, useScan, useThreatParam } from '../scan/store';
import { loadIgnored } from '../scan/threat-actions';
import { getThreatRowActions } from '../scan/threat-row-actions';
import { ThreatCell, formatDetected } from '../scan/threats-list';
import { HISTORY_STATUS_PARAM, HISTORY_THREAT_PARAM } from './store';
import type { ScanThreat } from '../scan/types';

const DEFAULT_LAYOUTS = { table: {} };
const NO_THREATS: ScanThreat[] = [];

/**
 * When a threat was fixed, or for an ignored one, when it was found.
 *
 * @param item - The threat.
 * @return The ISO date, or an empty string.
 */
const getDate = ( item: ScanThreat ) =>
	( item.status === 'fixed' ? item.fixedOn : item.firstDetected ) ?? '';

/**
 * Fixed threats from Scan history and the Scan list's ignored ones, laid out like the Scan list.
 *
 * Ignored threats open in the Scan inspector, which can unignore them.
 *
 * @param props         - Component props.
 * @param props.threats - Every threat in Scan history.
 * @return The table.
 */
export default function HistoryList( { threats }: { threats: ScanThreat[] } ) {
	const fixed = useMemo( () => threats.filter( item => item.status === 'fixed' ), [ threats ] );
	// Ignore and unignore update this list in place, so it is current right after either.
	const ignored = useScan()?.ignored ?? NO_THREATS;
	const [ statusParam, setStatusParam ] = useThreatParam( HISTORY_STATUS_PARAM );
	const status = statusParam === 'ignored' ? 'ignored' : 'fixed';

	useEffect( () => {
		loadIgnored();
	}, [] );

	const [ view, setView ] = useState< View >( {
		type: 'table',
		search: '',
		page: 1,
		perPage: 20,
		sort: { field: 'date', direction: 'desc' },
		fields: [ 'severity', 'threat', 'date' ],
		layout: {
			styles: {
				severity: { width: '1%', align: 'start' },
				threat: { width: '100%' },
				date: { width: '1%' },
			},
		},
	} );

	const onStatusChange = useCallback(
		( value: unknown ) => {
			setStatusParam( value === 'ignored' ? 'ignored' : undefined );
			setView( current => ( { ...current, page: 1 } ) );
		},
		[ setStatusParam ]
	);
	const [ selectedFixed ] = useThreatParam( HISTORY_THREAT_PARAM );
	const [ selectedIgnored ] = useThreatParam( THREAT_PARAM );
	const selected = status === 'fixed' ? selectedFixed : selectedIgnored;
	const selection = useMemo( () => ( selected ? [ selected ] : [] ), [ selected ] );
	const navigate = useNavigate();
	// One navigation sets both params, so only one inspector's param is ever in the URL.
	const open = useCallback(
		( item: ScanThreat ) => {
			const id = String( item.id );
			const isFixed = item.status === 'fixed';
			navigate( {
				search: ( prev: Record< string, unknown > ) => ( {
					...prev,
					[ HISTORY_THREAT_PARAM ]: isFixed ? id : undefined,
					[ THREAT_PARAM ]: isFixed ? undefined : id,
				} ),
			} as Parameters< typeof navigate >[ 0 ] );
		},
		[ navigate ]
	);
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
		],
		[ open, status ]
	);
	// History only shows with a Scan plan, so ignored threats can always be unignored.
	const actions = useMemo( () => getThreatRowActions( open, true ), [ open ] );

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
				empty={
					status === 'fixed'
						? __( 'Threats Scan fixes will appear here.', 'jetpack-protect-pkg' )
						: __( 'Threats you ignore will appear here.', 'jetpack-protect-pkg' )
				}
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
