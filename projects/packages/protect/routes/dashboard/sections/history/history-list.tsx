import { DataViews, filterSortAndPaginate, type View } from '@wordpress/dataviews';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { published, unseen } from '@wordpress/icons';
import { useNavigate } from '@wordpress/route';
import { EmptyState, Tabs } from '@wordpress/ui';
import useArrowKeyNavigation from '../../components/use-arrow-key-navigation';
import { recordViewChange } from '../../data/threat-events';
import { CLOSED_INSPECTOR } from '../inspector-params';
import { THREAT_PARAM, useScan, useSearchParam } from '../scan/store';
import { useThreatRowActions } from '../scan/threat-row-actions';
import { createThreatView, getThreatFields } from '../scan/threats-list';
import useOpenThreat from '../use-open-threat';
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
	const [ statusParam ] = useSearchParam( HISTORY_STATUS_PARAM );
	const status = statusParam === 'ignored' ? 'ignored' : 'fixed';

	const [ view, setView ] = useState< View >( () => createThreatView( 'date' ) );
	const navigate = useNavigate();

	// Switching lists closes the inspector, whose threat is in the list being left.
	const onStatusChange = useCallback(
		( value: unknown ) => {
			navigate( {
				search: ( prev: Record< string, unknown > ) => ( {
					...prev,
					...CLOSED_INSPECTOR,
					[ HISTORY_STATUS_PARAM ]: value === 'ignored' ? 'ignored' : undefined,
				} ),
			} as Parameters< typeof navigate >[ 0 ] );
			setView( current => ( { ...current, page: 1 } ) );
		},
		[ navigate ]
	);
	const [ selectedFixed ] = useSearchParam( HISTORY_THREAT_PARAM );
	const [ selectedIgnored ] = useSearchParam( THREAT_PARAM );
	const selected = status === 'fixed' ? selectedFixed : selectedIgnored;
	const selection = useMemo( () => ( selected ? [ selected ] : [] ), [ selected ] );
	const open = useOpenThreat();
	const getItemId = useCallback( ( item: ScanThreat ) => String( item.id ), [] );

	const fields = useMemo(
		() =>
			getThreatFields( open, {
				threatLabel:
					status === 'fixed'
						? __( 'Fixed threats', 'jetpack-protect-pkg' )
						: __( 'Ignored threats', 'jetpack-protect-pkg' ),
				dateLabel:
					status === 'fixed'
						? __( 'Fixed on', 'jetpack-protect-pkg' )
						: __( 'Detected on', 'jetpack-protect-pkg' ),
				getDate,
			} ),
		[ open, status ]
	);
	// History only shows with a Scan plan, so ignored threats can always be unignored.
	const actions = useThreatRowActions( open, true );

	const { data, paginationInfo } = useMemo(
		() => filterSortAndPaginate( status === 'fixed' ? fixed : ignored, view, fields ),
		[ status, fixed, ignored, view, fields ]
	);
	const { totalPages } = paginationInfo;
	const onChangeView = useCallback(
		( next: View ) => {
			recordViewChange( view, next, totalPages );
			setView( next );
		},
		[ view, totalPages ]
	);
	useArrowKeyNavigation( data, selected, getItemId, open );

	const table = (
		<DataViews
			empty={
				status === 'fixed' ? (
					<EmptyState.Root className="jp-protect-history-empty">
						<EmptyState.Icon icon={ published } />
						<EmptyState.Title>
							{ __( 'No fixed threats yet', 'jetpack-protect-pkg' ) }
						</EmptyState.Title>
						<EmptyState.Description>
							{ __(
								'When Scan fixes a threat on your site, it will be listed here with the date it was fixed.',
								'jetpack-protect-pkg'
							) }
						</EmptyState.Description>
					</EmptyState.Root>
				) : (
					<EmptyState.Root className="jp-protect-history-empty">
						<EmptyState.Icon icon={ unseen } />
						<EmptyState.Title>
							{ __( 'No ignored threats', 'jetpack-protect-pkg' ) }
						</EmptyState.Title>
						<EmptyState.Description>
							{ __(
								'Threats you ignore will be listed here, where you can unignore them at any time.',
								'jetpack-protect-pkg'
							) }
						</EmptyState.Description>
					</EmptyState.Root>
				)
			}
			data={ data }
			fields={ fields }
			actions={ actions }
			view={ view }
			onChangeView={ onChangeView }
			paginationInfo={ paginationInfo }
			defaultLayouts={ DEFAULT_LAYOUTS }
			getItemId={ getItemId }
			selection={ selection }
		>
			<DataViews.Layout />
			<DataViews.Footer />
		</DataViews>
	);

	const panelTabIndex = data.length ? -1 : 0;

	return (
		<Tabs.Root className="jp-protect-threats" value={ status } onValueChange={ onStatusChange }>
			<div className="jp-protect-threats__filter">
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
			</div>
			{ /* Row controls take focus, so a panel with rows shouldn't be an extra tab stop. */ }
			<Tabs.Panel value="fixed" tabIndex={ panelTabIndex }>
				{ status === 'fixed' && table }
			</Tabs.Panel>
			<Tabs.Panel value="ignored" tabIndex={ panelTabIndex }>
				{ status === 'ignored' && table }
			</Tabs.Panel>
		</Tabs.Root>
	);
}
