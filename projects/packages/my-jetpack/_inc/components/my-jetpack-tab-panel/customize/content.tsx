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
import { arrowDown, arrowUp } from '@wordpress/icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
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

/**
 * My Jetpack Customize tab content.
 *
 * @return The rendered component.
 */
export function CustomizeContent() {
	const initialModel = useMemo( () => getInitialModel(), [] );
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
	const userIsAdmin = getMyJetpackWindowInitialState( 'userIsAdmin' ) === true;

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

	const updateItem = useCallback( ( id: string, updates: Partial< AdminMenuItem > ) => {
		setItems( currentItems =>
			currentItems.map( item => ( item.id === id ? { ...item, ...updates } : item ) )
		);
	}, [] );

	const moveItem = useCallback( ( id: string, direction: -1 | 1 ) => {
		setItems( currentItems => {
			const orderedItems = getOrderedItems( currentItems );
			const index = orderedItems.findIndex( item => item.id === id );
			const nextIndex = index + direction;

			if ( index < 0 || nextIndex < 0 || nextIndex >= orderedItems.length ) {
				return currentItems;
			}

			const nextItems = [ ...orderedItems ];
			const item = nextItems[ index ];
			nextItems[ index ] = nextItems[ nextIndex ];
			nextItems[ nextIndex ] = item;

			return nextItems.map( ( menuItem, itemIndex ) => ( {
				...menuItem,
				order: itemIndex * 10,
			} ) );
		} );
	}, [] );

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
				<Notice status={ notice.status } onRemove={ () => setNotice( null ) }>
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
							{ Object.values( groups )
								.filter( group => group.label )
								.sort( ( a, b ) => a.order - b.order )
								.map( group => (
									<TextControl
										key={ group.id }
										label={ group.id }
										value={ group.label }
										onChange={ label =>
											setGroups( currentGroups => ( {
												...currentGroups,
												[ group.id ]: {
													...group,
													label,
												},
											} ) )
										}
									/>
								) ) }
						</div>
					</PanelBody>
				) }

				<PanelBody title={ __( 'Menu', 'jetpack-my-jetpack' ) } initialOpen>
					<div className={ styles[ 'item-list' ] }>
						{ getOrderedItems( items ).map( ( item, index ) => (
							<div key={ item.id } className={ styles[ 'item-row' ] }>
								<ToggleControl
									label={ item.label }
									checked={ ! item.hidden }
									disabled={ ! item.customizable }
									onChange={ checked => updateItem( item.id, { hidden: ! checked } ) }
								/>
								<SelectControl
									label={ __( 'Group', 'jetpack-my-jetpack' ) }
									hideLabelFromVision
									value={ item.group }
									options={ groupOptions }
									disabled={ ! item.customizable }
									onChange={ group => updateItem( item.id, { group: String( group ) } ) }
								/>
								<div className={ styles[ 'item-actions' ] }>
									<Button
										icon={ arrowUp }
										label={ __( 'Move up', 'jetpack-my-jetpack' ) }
										showTooltip
										disabled={ index === 0 || ! item.customizable }
										onClick={ () => moveItem( item.id, -1 ) }
									/>
									<Button
										icon={ arrowDown }
										label={ __( 'Move down', 'jetpack-my-jetpack' ) }
										showTooltip
										disabled={ index === items.length - 1 || ! item.customizable }
										onClick={ () => moveItem( item.id, 1 ) }
									/>
								</div>
							</div>
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
						<Button
							variant="tertiary"
							disabled={ isSaving }
							onClick={ () =>
								saveLayout( 'site', {
									enabled: false,
									groups: {},
									items: {},
								} )
							}
						>
							{ __( 'Use legacy menu', 'jetpack-my-jetpack' ) }
						</Button>
					</>
				) }
			</div>
		</div>
	);
}
