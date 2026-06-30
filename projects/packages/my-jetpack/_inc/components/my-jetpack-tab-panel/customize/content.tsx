import apiFetch from '@wordpress/api-fetch';
import {
	Button,
	Notice,
	Panel,
	PanelBody,
	SelectControl,
	Spinner,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { arrowDown, arrowUp, dragHandle, Icon } from '@wordpress/icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { REST_API_ADMIN_MENU_CUSTOMIZATION } from '../../../data/constants';
import { getMyJetpackWindowInitialState } from '../../../data/utils/get-my-jetpack-window-state';
import styles from './styles.module.scss';

type AdminMenuGroup = {
	id: string;
	label: string;
	order: number;
};

type AdminMenuItem = {
	id: string;
	label: string;
	menuSlug: string;
	group: string;
	groupLabel: string;
	order: number;
	customizable: boolean;
	hidden: boolean;
	external: boolean;
};

type AdminMenuLayout = {
	enabled: boolean;
	groups: Record< string, AdminMenuGroup >;
	items: Record< string, Partial< AdminMenuItem > >;
};

type AdminMenuModel = {
	featureEnabled: boolean;
	active: boolean;
	siteLayout: AdminMenuLayout;
	userLayout: AdminMenuLayout;
	groups: AdminMenuGroup[];
	items: AdminMenuItem[];
};

type NoticeState = {
	status: 'success' | 'error';
	message: string;
};

type SortableOptions = {
	cancel: string;
	containment: HTMLElement;
	cursor: string;
	forcePlaceholderSize: boolean;
	handle: string;
	items: string;
	placeholder: string;
	tolerance: string;
	update: () => void;
};

type SortableCollection = {
	sortable: ( options: SortableOptions | 'destroy' ) => SortableCollection;
};

type SortableJQuery = ( element: HTMLElement ) => SortableCollection;

declare global {
	interface Window {
		jQuery?: SortableJQuery;
	}
}

type GroupLabelControlProps = {
	group: AdminMenuGroup;
	onChange: ( id: string, label: string ) => void;
};

type MenuItemRowProps = {
	groupOptions: { label: string; value: string }[];
	index: number;
	isLast: boolean;
	item: AdminMenuItem;
	onMove: ( id: string, direction: -1 | 1 ) => void;
	onUpdate: ( id: string, updates: Partial< AdminMenuItem > ) => void;
};

const emptyLayout: AdminMenuLayout = {
	enabled: false,
	groups: {},
	items: {},
};

const emptyModel: AdminMenuModel = {
	featureEnabled: false,
	active: false,
	siteLayout: emptyLayout,
	userLayout: emptyLayout,
	groups: [],
	items: [],
};

const getInitialModel = (): AdminMenuModel => {
	const model = getMyJetpackWindowInitialState( 'adminMenuCustomization' ) as
		| Partial< AdminMenuModel >
		| undefined;

	return {
		...emptyModel,
		...model,
		siteLayout: {
			...emptyLayout,
			...( model?.siteLayout ?? {} ),
		},
		userLayout: {
			...emptyLayout,
			...( model?.userLayout ?? {} ),
		},
		groups: model?.groups ?? [],
		items: model?.items ?? [],
	};
};

const getGroupsRecord = ( groups: AdminMenuGroup[] ) =>
	groups.reduce< Record< string, AdminMenuGroup > >( ( result, group ) => {
		result[ group.id ] = group;
		return result;
	}, {} );

const getOrderedItems = ( items: AdminMenuItem[] ) =>
	[ ...items ].sort( ( a, b ) => {
		if ( a.order === b.order ) {
			return a.label.localeCompare( b.label );
		}

		return a.order - b.order;
	} );

export const reorderAdminMenuItems = ( items: AdminMenuItem[], orderedIds: string[] ) => {
	const sortedItems = getOrderedItems( items );
	const itemById = new Map( sortedItems.map( item => [ item.id, item ] ) );
	const reorderedIds = new Set< string >();
	const reorderedItems = orderedIds.reduce< AdminMenuItem[] >( ( result, id ) => {
		const item = itemById.get( id );

		if ( item && ! reorderedIds.has( id ) ) {
			result.push( item );
			reorderedIds.add( id );
		}

		return result;
	}, [] );

	sortedItems.forEach( item => {
		if ( ! reorderedIds.has( item.id ) ) {
			reorderedItems.push( item );
		}
	} );

	return reorderedItems.map( ( item, index ) => ( {
		...item,
		order: index * 10,
	} ) );
};

const GroupLabelControl = ( { group, onChange }: GroupLabelControlProps ) => {
	const handleChange = useCallback(
		( label: string ) => {
			onChange( group.id, label );
		},
		[ group.id, onChange ]
	);

	return (
		<TextControl
			key={ group.id }
			label={ group.id }
			value={ group.label }
			onChange={ handleChange }
		/>
	);
};

const MenuItemRow = ( {
	groupOptions,
	index,
	isLast,
	item,
	onMove,
	onUpdate,
}: MenuItemRowProps ) => {
	const handleVisibilityChange = useCallback(
		( checked: boolean ) => {
			onUpdate( item.id, { hidden: ! checked } );
		},
		[ item.id, onUpdate ]
	);
	const handleGroupChange = useCallback(
		( group: string | string[] ) => {
			onUpdate( item.id, { group: String( group ) } );
		},
		[ item.id, onUpdate ]
	);
	const handleMoveUp = useCallback( () => {
		onMove( item.id, -1 );
	}, [ item.id, onMove ] );
	const handleMoveDown = useCallback( () => {
		onMove( item.id, 1 );
	}, [ item.id, onMove ] );
	const dragHandleClassName = item.customizable
		? `${ styles[ 'drag-handle' ] } ${ styles[ 'drag-handle-active' ] }`
		: styles[ 'drag-handle' ];

	return (
		<div className={ styles[ 'item-row' ] } data-menu-item-id={ item.id }>
			<span className={ dragHandleClassName } aria-hidden="true">
				<Icon icon={ dragHandle } />
			</span>
			<ToggleControl
				label={ item.label }
				checked={ ! item.hidden }
				disabled={ ! item.customizable }
				onChange={ handleVisibilityChange }
			/>
			<SelectControl
				label={ __( 'Group', 'jetpack-my-jetpack' ) }
				hideLabelFromVision
				value={ item.group }
				options={ groupOptions }
				disabled={ ! item.customizable }
				onChange={ handleGroupChange }
			/>
			<div className={ styles[ 'item-actions' ] }>
				<Button
					icon={ arrowUp }
					label={ __( 'Move up', 'jetpack-my-jetpack' ) }
					showTooltip
					disabled={ index === 0 || ! item.customizable }
					onClick={ handleMoveUp }
				/>
				<Button
					icon={ arrowDown }
					label={ __( 'Move down', 'jetpack-my-jetpack' ) }
					showTooltip
					disabled={ isLast || ! item.customizable }
					onClick={ handleMoveDown }
				/>
			</div>
		</div>
	);
};

/**
 * My Jetpack Customize tab content.
 *
 * @return The rendered component.
 */
export function CustomizeContent() {
	const initialModel = useMemo( () => getInitialModel(), [] );
	const itemListRef = useRef< HTMLDivElement | null >( null );
	const [ model, setModel ] = useState< AdminMenuModel >( initialModel );
	const [ items, setItems ] = useState< AdminMenuItem[] >( () =>
		getOrderedItems( initialModel.items )
	);
	const [ groups, setGroups ] = useState< Record< string, AdminMenuGroup > >( () =>
		getGroupsRecord( initialModel.groups )
	);
	const [ enabled, setEnabled ] = useState( initialModel.siteLayout.enabled );
	const [ isLoading, setIsLoading ] = useState( false );
	const [ isSaving, setIsSaving ] = useState( false );
	const [ notice, setNotice ] = useState< NoticeState | null >( null );
	const userIsAdminValue = getMyJetpackWindowInitialState( 'userIsAdmin' ) as unknown;
	const userIsAdmin = userIsAdminValue === true || userIsAdminValue === '1';

	const applyModel = useCallback( ( nextModel: AdminMenuModel ) => {
		setModel( nextModel );
		setItems( getOrderedItems( nextModel.items ) );
		setGroups( getGroupsRecord( nextModel.groups ) );
		setEnabled( nextModel.siteLayout.enabled );
	}, [] );

	useEffect( () => {
		if ( ! initialModel.featureEnabled ) {
			return;
		}

		setIsLoading( true );
		apiFetch< AdminMenuModel >( { path: REST_API_ADMIN_MENU_CUSTOMIZATION } )
			.then( applyModel )
			.catch( () => {
				setNotice( {
					status: 'error',
					message: __( 'Could not load menu preferences.', 'jetpack-my-jetpack' ),
				} );
			} )
			.finally( () => setIsLoading( false ) );
	}, [ applyModel, initialModel.featureEnabled ] );

	const groupOptions = useMemo(
		() =>
			Object.values( groups )
				.sort( ( a, b ) => a.order - b.order )
				.map( group => ( {
					label: group.label || group.id,
					value: group.id,
				} ) ),
		[ groups ]
	);
	const visibleGroups = useMemo(
		() =>
			Object.values( groups )
				.filter( group => group.label )
				.sort( ( a, b ) => a.order - b.order ),
		[ groups ]
	);
	const orderedItems = useMemo( () => getOrderedItems( items ), [ items ] );

	const reorderItems = useCallback( ( orderedIds: string[] ) => {
		setItems( currentItems => reorderAdminMenuItems( currentItems, orderedIds ) );
	}, [] );

	const updateItem = useCallback( ( id: string, updates: Partial< AdminMenuItem > ) => {
		setItems( currentItems =>
			currentItems.map( item => ( item.id === id ? { ...item, ...updates } : item ) )
		);
	}, [] );
	const updateGroupLabel = useCallback( ( id: string, label: string ) => {
		setGroups( currentGroups => ( {
			...currentGroups,
			[ id ]: {
				...currentGroups[ id ],
				label,
			},
		} ) );
	}, [] );

	const moveItem = useCallback( ( id: string, direction: -1 | 1 ) => {
		setItems( currentItems => {
			const sortedItems = getOrderedItems( currentItems );
			const index = sortedItems.findIndex( item => item.id === id );
			const nextIndex = index + direction;

			if ( index < 0 || nextIndex < 0 || nextIndex >= sortedItems.length ) {
				return currentItems;
			}

			const nextItems = [ ...sortedItems ];
			const item = nextItems[ index ];
			nextItems[ index ] = nextItems[ nextIndex ];
			nextItems[ nextIndex ] = item;

			return reorderAdminMenuItems(
				currentItems,
				nextItems.map( menuItem => menuItem.id )
			);
		} );
	}, [] );

	useEffect( () => {
		const listElement = itemListRef.current;
		const sortable = window.jQuery;

		if ( ! listElement || ! sortable ) {
			return;
		}

		const sortableList = sortable( listElement );

		if ( typeof sortableList.sortable !== 'function' ) {
			return;
		}

		sortableList.sortable( {
			cancel: 'input, select, textarea, button',
			containment: listElement,
			cursor: 'move',
			forcePlaceholderSize: true,
			handle: `.${ styles[ 'drag-handle-active' ] }`,
			items: `> .${ styles[ 'item-row' ] }`,
			placeholder: styles[ 'item-row-placeholder' ],
			tolerance: 'pointer',
			update: () => {
				const orderedIds = Array.from(
					listElement.querySelectorAll< HTMLElement >( '[data-menu-item-id]' )
				)
					.map( row => row.dataset.menuItemId )
					.filter( Boolean ) as string[];

				reorderItems( orderedIds );
			},
		} );

		return () => {
			sortableList.sortable( 'destroy' );
		};
	}, [ orderedItems, reorderItems ] );

	const buildItemsLayout = useCallback(
		() =>
			items.reduce< AdminMenuLayout[ 'items' ] >( ( result, item, index ) => {
				result[ item.id ] = {
					group: item.group,
					hidden: item.hidden,
					order: index * 10,
				};
				return result;
			}, {} ),
		[ items ]
	);

	const saveLayout = useCallback(
		( scope: 'site' | 'user', layout: Partial< AdminMenuLayout > ) => {
			setIsSaving( true );
			setNotice( null );

			apiFetch< AdminMenuModel >( {
				path: REST_API_ADMIN_MENU_CUSTOMIZATION,
				method: 'POST',
				data: {
					scope,
					layout,
				},
			} )
				.then( nextModel => {
					applyModel( nextModel );
					setNotice( {
						status: 'success',
						message:
							scope === 'site'
								? __( 'Site menu defaults saved.', 'jetpack-my-jetpack' )
								: __( 'Personal menu saved.', 'jetpack-my-jetpack' ),
					} );
				} )
				.catch( () => {
					setNotice( {
						status: 'error',
						message: __( 'Could not save menu preferences.', 'jetpack-my-jetpack' ),
					} );
				} )
				.finally( () => setIsSaving( false ) );
		},
		[ applyModel ]
	);

	const saveSiteLayout = useCallback( () => {
		saveLayout( 'site', {
			enabled,
			groups,
			items: buildItemsLayout(),
		} );
	}, [ buildItemsLayout, enabled, groups, saveLayout ] );

	const savePersonalLayout = useCallback( () => {
		saveLayout( 'user', {
			items: buildItemsLayout(),
		} );
	}, [ buildItemsLayout, saveLayout ] );
	const useLegacyMenu = useCallback( () => {
		saveLayout( 'site', {
			enabled: false,
			groups: {},
			items: {},
		} );
	}, [ saveLayout ] );
	const dismissNotice = useCallback( () => {
		setNotice( null );
	}, [] );

	if ( ! model.featureEnabled ) {
		return (
			<Notice status="info" isDismissible={ false }>
				{ __( 'Menu customization is not available on this site.', 'jetpack-my-jetpack' ) }
			</Notice>
		);
	}

	return (
		<div className={ styles.customize }>
			<div className={ styles.header }>
				<h2>{ __( 'Customize', 'jetpack-my-jetpack' ) }</h2>
				{ isLoading && <Spinner /> }
			</div>

			{ notice && (
				<Notice status={ notice.status } onRemove={ dismissNotice }>
					{ notice.message }
				</Notice>
			) }

			<Panel>
				{ userIsAdmin && (
					<PanelBody title={ __( 'Defaults', 'jetpack-my-jetpack' ) } initialOpen>
						<ToggleControl
							label={ __( 'Recommended menu', 'jetpack-my-jetpack' ) }
							checked={ enabled }
							onChange={ setEnabled }
						/>
						<div className={ styles[ 'group-grid' ] }>
							{ visibleGroups.map( group => (
								<GroupLabelControl key={ group.id } group={ group } onChange={ updateGroupLabel } />
							) ) }
						</div>
					</PanelBody>
				) }

				<PanelBody title={ __( 'Menu', 'jetpack-my-jetpack' ) } initialOpen>
					<div className={ styles[ 'item-list' ] } ref={ itemListRef }>
						{ orderedItems.map( ( item, index ) => (
							<MenuItemRow
								key={ item.id }
								groupOptions={ groupOptions }
								index={ index }
								isLast={ index === orderedItems.length - 1 }
								item={ item }
								onMove={ moveItem }
								onUpdate={ updateItem }
							/>
						) ) }
					</div>
				</PanelBody>
			</Panel>

			<div className={ styles.actions }>
				<Button
					variant="primary"
					isBusy={ isSaving }
					disabled={ isSaving }
					onClick={ savePersonalLayout }
				>
					{ __( 'Save my menu', 'jetpack-my-jetpack' ) }
				</Button>
				{ userIsAdmin && (
					<>
						<Button
							variant="secondary"
							isBusy={ isSaving }
							disabled={ isSaving }
							onClick={ saveSiteLayout }
						>
							{ __( 'Save defaults', 'jetpack-my-jetpack' ) }
						</Button>
						<Button variant="tertiary" disabled={ isSaving } onClick={ useLegacyMenu }>
							{ __( 'Use legacy menu', 'jetpack-my-jetpack' ) }
						</Button>
					</>
				) }
			</div>
		</div>
	);
}
