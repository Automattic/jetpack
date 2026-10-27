import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';
import { Badge, Button, EmptyState, Stack, Text } from '@wordpress/ui';
import { deleteFlow, fetchCatalog, fetchFlows, setFlowEnabled } from '../../src/ui/api';
import { FlowPage } from '../../src/ui/components/flow-page';
import { ProductIcon } from '../../src/ui/components/product-icon';
import type { Catalog, Flow } from '../../src/ui/types';
import type { Action, Field, View } from '@wordpress/dataviews';
import '../../src/ui/style.scss';

const DEFAULT_VIEW: View = {
	type: 'table',
	page: 1,
	perPage: 20,
	search: '',
	titleField: 'name',
	fields: [ 'trigger', 'steps', 'status', 'modified' ],
	layout: {},
};

function FlowSummary( { flow, catalog }: { flow: Flow; catalog: Catalog } ) {
	const trigger = catalog.triggers.find( t => t.id === flow.trigger.type );
	return (
		<Stack direction="column" gap="md">
			<Stack align="center" gap="sm">
				{ trigger && <ProductIcon product={ trigger.product } size={ 24 } /> }
				<Text variant="body-md">
					{ __( 'When…', 'jetpack-flow-pkg' ) }{ ' ' }
					<strong>{ trigger?.label ?? flow.trigger.type }</strong>
				</Text>
			</Stack>
			{ flow.steps.map( ( step, index ) => {
				const action = catalog.actions.find( a => a.id === step.type );
				return (
					<Stack key={ step.id } align="center" gap="sm">
						{ action && <ProductIcon product={ action.product } size={ 24 } /> }
						<Text variant="body-md">
							{ index === 0 ? __( 'Then…', 'jetpack-flow-pkg' ) : __( 'And', 'jetpack-flow-pkg' ) }{ ' ' }
							<strong>{ action?.label ?? step.type }</strong>
						</Text>
					</Stack>
				);
			} ) }
		</Stack>
	);
}

function FlowsStage() {
	const navigate = useNavigate();
	const [ catalog, setCatalog ] = useState< Catalog | null >( null );
	const [ flows, setFlows ] = useState< Flow[] | null >( null );
	const [ view, setView ] = useState< View >( DEFAULT_VIEW );

	const reload = () => fetchFlows().then( setFlows );

	useEffect( () => {
		fetchCatalog().then( setCatalog );
		reload();
	}, [] );

	const fields = useMemo< Field< Flow >[] >(
		() => [
			{
				id: 'name',
				label: __( 'Name', 'jetpack-flow-pkg' ),
				getValue: ( { item } ) => item.name,
				enableGlobalSearch: true,
				enableHiding: false,
			},
			{
				id: 'trigger',
				label: __( 'When…', 'jetpack-flow-pkg' ),
				getValue: ( { item } ) =>
					catalog?.triggers.find( t => t.id === item.trigger.type )?.label ?? item.trigger.type,
				render: ( { item } ) => {
					const trigger = catalog?.triggers.find( t => t.id === item.trigger.type );
					return (
						<Stack align="center" gap="xs">
							{ trigger && <ProductIcon product={ trigger.product } /> }
							<span>{ trigger?.label ?? item.trigger.type }</span>
						</Stack>
					);
				},
				enableGlobalSearch: true,
			},
			{
				id: 'steps',
				label: __( 'Then…', 'jetpack-flow-pkg' ),
				getValue: ( { item } ) =>
					item.steps
						.map( s => catalog?.actions.find( a => a.id === s.type )?.label ?? s.type )
						.join( ', ' ),
				render: ( { item } ) => (
					<Stack align="center" gap="xs">
						{ item.steps.slice( 0, 3 ).map( step => {
							const action = catalog?.actions.find( a => a.id === step.type );
							return action ? <ProductIcon key={ step.id } product={ action.product } /> : null;
						} ) }
						<span>
							{ sprintf(
								/* translators: %d: number of actions in a flow. */
								_n( '%d action', '%d actions', item.steps.length, 'jetpack-flow-pkg' ),
								item.steps.length
							) }
						</span>
					</Stack>
				),
			},
			{
				id: 'status',
				label: __( 'Status', 'jetpack-flow-pkg' ),
				getValue: ( { item } ) => ( item.enabled ? 'enabled' : 'disabled' ),
				elements: [
					{ value: 'enabled', label: __( 'Enabled', 'jetpack-flow-pkg' ) },
					{ value: 'disabled', label: __( 'Disabled', 'jetpack-flow-pkg' ) },
				],
				filterBy: { operators: [ 'is' ] },
				render: ( { item } ) => (
					<Badge intent={ item.enabled ? 'stable' : 'draft' }>
						{ item.enabled
							? __( 'Enabled', 'jetpack-flow-pkg' )
							: __( 'Disabled', 'jetpack-flow-pkg' ) }
					</Badge>
				),
			},
			{
				id: 'modified',
				label: __( 'Last edited', 'jetpack-flow-pkg' ),
				type: 'datetime',
				getValue: ( { item } ) => item.modified ?? '',
			},
		],
		[ catalog ]
	);

	const actions = useMemo< Action< Flow >[] >(
		() => [
			{
				id: 'view',
				label: __( 'View', 'jetpack-flow-pkg' ),
				modalHeader: __( 'Flow details', 'jetpack-flow-pkg' ),
				RenderModal: ( { items } ) =>
					catalog ? <FlowSummary flow={ items[ 0 ] } catalog={ catalog } /> : null,
			},
			{
				id: 'edit',
				label: __( 'Edit', 'jetpack-flow-pkg' ),
				isPrimary: true,
				callback: ( items: Flow[] ) => navigate( { href: `/edit/${ items[ 0 ].id }` } ),
			},
			{
				id: 'toggle',
				label: ( items: Flow[] ) =>
					items[ 0 ]?.enabled
						? __( 'Disable', 'jetpack-flow-pkg' )
						: __( 'Enable', 'jetpack-flow-pkg' ),
				callback: async ( items: Flow[] ) => {
					await Promise.all( items.map( f => setFlowEnabled( f.id as number, ! f.enabled ) ) );
					await reload();
				},
				supportsBulk: true,
			},
			{
				id: 'delete',
				label: __( 'Delete', 'jetpack-flow-pkg' ),
				isDestructive: true,
				supportsBulk: true,
				modalHeader: __( 'Delete flow', 'jetpack-flow-pkg' ),
				RenderModal: ( { items, closeModal } ) => (
					<Stack direction="column" gap="lg">
						<Text>
							{ sprintf(
								/* translators: %d: number of flows. */
								_n(
									'Delete %d flow? This cannot be undone.',
									'Delete %d flows? This cannot be undone.',
									items.length,
									'jetpack-flow-pkg'
								),
								items.length
							) }
						</Text>
						<Stack justify="flex-end" gap="sm">
							<Button variant="outline" onClick={ closeModal }>
								{ __( 'Cancel', 'jetpack-flow-pkg' ) }
							</Button>
							<Button
								onClick={ async () => {
									await Promise.all( items.map( f => deleteFlow( f.id as number ) ) );
									await reload();
									closeModal?.();
								} }
							>
								{ __( 'Delete', 'jetpack-flow-pkg' ) }
							</Button>
						</Stack>
					</Stack>
				),
			},
		],
		[ catalog, navigate ]
	);

	const { data, paginationInfo } = useMemo(
		() => filterSortAndPaginate( flows ?? [], view, fields ),
		[ flows, view, fields ]
	);

	return (
		<FlowPage tab="flows">
			<div className="jetpack-flow-list">
				<DataViews
					data={ data }
					fields={ fields }
					view={ view }
					onChangeView={ setView }
					actions={ actions }
					paginationInfo={ paginationInfo }
					getItemId={ ( item: Flow ) => String( item.id ) }
					isLoading={ flows === null }
					defaultLayouts={ { table: {} } }
					search
					searchLabel={ __( 'Search flows…', 'jetpack-flow-pkg' ) }
					empty={
						<EmptyState.Root>
							<EmptyState.Title>{ __( 'No flows yet', 'jetpack-flow-pkg' ) }</EmptyState.Title>
							<EmptyState.Description>
								{ __( 'Build your first flow in the New tab.', 'jetpack-flow-pkg' ) }
							</EmptyState.Description>
							<EmptyState.Actions>
								<Button onClick={ () => navigate( { href: '/' } ) }>
									{ __( 'New flow', 'jetpack-flow-pkg' ) }
								</Button>
							</EmptyState.Actions>
						</EmptyState.Root>
					}
				/>
			</div>
		</FlowPage>
	);
}

export const stage = FlowsStage;
