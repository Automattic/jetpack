import { ThreatSeverityBadge } from '@automattic/jetpack-scan';
import { DataViews, filterSortAndPaginate, type Field, type View } from '@wordpress/dataviews';
import { dateI18n } from '@wordpress/date';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { chevronRight, moreVertical } from '@wordpress/icons';
import { Button, IconButton, Menu, Stack, Tabs } from '@wordpress/ui';
import { getSoftwareActionLabels, getThreatLabel } from './labels';
import { useThreatParam } from './store';
import { ignoreThreat, unignoreThreat, useThreatAction } from './threat-actions';
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
 * More actions for a threat: update, deactivate or look up the affected software, and ignore.
 *
 * @param props        - Component props.
 * @param props.item   - The threat.
 * @param props.onOpen - Opens the threat in the inspector.
 * @param props.canAct - Whether the site can ignore threats.
 * @return The menu.
 */
function ThreatMenu( { item, onOpen, canAct }: ActionProps ) {
	const actions = item.extension?.actions ?? {};
	const isIgnored = item.status === 'ignored';
	const onView = useCallback( () => onOpen( item ), [ item, onOpen ] );
	const onToggleIgnore = useCallback(
		() => ( isIgnored ? unignoreThreat( item ) : ignoreThreat( item ) ),
		[ isIgnored, item ]
	);
	const labels = getSoftwareActionLabels( item );

	return (
		<Menu.Root>
			<Menu.Trigger
				render={
					<IconButton
						icon={ moreVertical }
						label={ __( 'More actions', 'jetpack-protect-pkg' ) }
						variant="minimal"
						tone="neutral"
						size="compact"
					/>
				}
			/>
			<Menu.Popup positioner={ <Menu.Positioner align="end" /> }>
				<Menu.Item onClick={ onView }>
					<Menu.ItemLabel>{ __( 'View details', 'jetpack-protect-pkg' ) }</Menu.ItemLabel>
				</Menu.Item>
				{ actions.update && (
					<Menu.LinkItem href={ actions.update }>
						<Menu.ItemLabel>{ labels.update }</Menu.ItemLabel>
					</Menu.LinkItem>
				) }
				{ actions.deactivate && (
					<Menu.LinkItem href={ actions.deactivate }>
						<Menu.ItemLabel>{ labels.deactivate }</Menu.ItemLabel>
					</Menu.LinkItem>
				) }
				{ actions.details && (
					<Menu.LinkItem href={ actions.details } openInNewTab>
						<Menu.ItemLabel>
							{ __( 'View on WordPress.org', 'jetpack-protect-pkg' ) }
						</Menu.ItemLabel>
					</Menu.LinkItem>
				) }
				{ canAct && (
					<>
						<Menu.Separator />
						<Menu.Item onClick={ onToggleIgnore }>
							<Menu.ItemLabel>
								{ isIgnored
									? __( 'Unignore threat', 'jetpack-protect-pkg' )
									: __( 'Ignore threat', 'jetpack-protect-pkg' ) }
							</Menu.ItemLabel>
						</Menu.Item>
					</>
				) }
			</Menu.Popup>
		</Menu.Root>
	);
}

/**
 * The actions column: Auto-fix when a fix exists, the menu, then a chevron to the details.
 *
 * @param props        - Component props.
 * @param props.item   - The threat.
 * @param props.onOpen - Opens the threat in the inspector.
 * @param props.canAct - Whether the site can fix and ignore threats.
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
			<ThreatMenu item={ item } onOpen={ onOpen } canAct={ canAct } />
			<IconButton
				icon={ chevronRight }
				label={ __( 'View details', 'jetpack-protect-pkg' ) }
				variant="minimal"
				tone="neutral"
				size="compact"
				onClick={ onClick }
			/>
		</Stack>
	);
}

type ThreatsListProps = {
	threats: ScanThreat[];
	/** Ignored threats, or undefined when the site can't ignore threats or they haven't loaded. */
	ignored?: ScanThreat[];
	/** Shown when there are no active threats. */
	empty?: ReactNode;
	/** Whether the site's plan can fix and ignore threats. */
	canAct: boolean;
};

/**
 * The threats a scan found, or those the site ignored; choosing one opens its details in the inspector.
 *
 * @param props         - Component props.
 * @param props.threats - The active threats.
 * @param props.ignored - The ignored threats.
 * @param props.empty   - Shown when there are no active threats.
 * @param props.canAct  - Whether the site can fix and ignore threats.
 * @return The table.
 */
export default function ThreatsList( { threats, ignored, empty, canAct }: ThreatsListProps ) {
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

	const [ status, setStatus ] = useState< 'active' | 'ignored' >( 'active' );
	const isIgnoredView = status === 'ignored' && !! ignored?.length;
	const onStatusChange = useCallback( ( value: unknown ) => {
		setStatus( value === 'ignored' ? 'ignored' : 'active' );
		setView( current => ( { ...current, page: 1 } ) );
	}, [] );
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
		() => filterSortAndPaginate( isIgnoredView ? ignored : threats, view, fields ),
		[ isIgnoredView, ignored, threats, view, fields ]
	);

	return (
		<div className="jp-protect-threats">
			{ ignored && ignored.length > 0 && (
				<div className="jp-protect-threats__filter">
					<Tabs.Root
						value={ isIgnoredView ? 'ignored' : 'active' }
						onValueChange={ onStatusChange }
					>
						<Tabs.List variant="minimal">
							<Tabs.Tab value="active">
								{ sprintf(
									/* translators: %d is a number of threats. */
									__( 'Active (%d)', 'jetpack-protect-pkg' ),
									threats.length
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
			) }
			<DataViews
				empty={ isIgnoredView ? undefined : empty }
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
