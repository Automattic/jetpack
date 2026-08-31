/* eslint-disable react/jsx-no-bind */

import apiFetch from '@wordpress/api-fetch';
import { __, sprintf } from '@wordpress/i18n';
import { arrowDown, arrowUp, dragHandle, Icon, lock, plus, trash } from '@wordpress/icons';
import {
	Button,
	Card,
	Checkbox,
	IconButton,
	InputControl,
	Notice,
	Stack,
	Tabs,
	Text,
} from '@wordpress/ui';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { REST_API_ADMIN_MENU_CUSTOMIZATION } from '../../../data/constants';
import { useAllProducts } from '../../../data/products/use-all-products';
import { getMyJetpackWindowInitialState } from '../../../data/utils/get-my-jetpack-window-state';
import { useAllJetpackModules } from '../products/use-all-jetpack-modules';
import { InactiveProductRow } from './inactive-product-row';
import { createJetpackMenuPreview, type JetpackMenuPreview } from './live-preview';
import {
	addCustomSeparator,
	alphabetizeMenuSections,
	buildMenuSequence,
	hasDraftChanged,
	moveEditableNode,
	removeCustomSeparator,
	reorderEditableNodes,
	serializeDraftLayout,
	updateCustomSeparator,
	updateItemVisibility,
} from './menu-sequence';
import {
	getMenuCatalogState,
	getMenuProductModuleSlug,
	insertActivatedItem,
} from './product-catalog';
import styles from './styles.module.scss';
import type {
	AdminMenuItem,
	AdminMenuLayout,
	AdminMenuModel,
	MenuItemNode,
	MenuNode,
	NoticeState,
} from './types';

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
	sortable: {
		( options: SortableOptions | 'destroy' ): SortableCollection;
		( command: 'option', option: 'disabled', value: boolean ): SortableCollection;
	};
};

type SortableJQuery = ( element: HTMLElement ) => SortableCollection;

declare global {
	interface Window {
		jQuery?: SortableJQuery;
	}
}

const emptyLayout: AdminMenuLayout = {
	items: {},
	separators: {},
};

const emptyModel: AdminMenuModel = {
	featureEnabled: false,
	active: false,
	hasPersonalLayout: false,
	siteLayout: { ...emptyLayout, enabled: false },
	userLayout: emptyLayout,
	separators: {},
	items: [],
};

const normalizeModel = ( model?: Partial< AdminMenuModel > ): AdminMenuModel => ( {
	...emptyModel,
	...model,
	siteLayout: {
		...emptyLayout,
		enabled: false,
		...( model?.siteLayout ?? {} ),
		items: model?.siteLayout?.items ?? {},
		separators: model?.siteLayout?.separators ?? {},
	},
	userLayout: {
		...emptyLayout,
		...( model?.userLayout ?? {} ),
		items: model?.userLayout?.items ?? {},
		separators: model?.userLayout?.separators ?? {},
	},
	separators: model?.separators ?? {},
	items: ( model?.items ?? [] ).map( item => ( {
		...item,
		hasSavedOrder: item.hasSavedOrder ?? false,
		registered: item.registered ?? true,
	} ) ),
} );

const mergeCanonicalItems = ( previous: AdminMenuItem[], next: AdminMenuItem[] ) => {
	const previousById = new Map( previous.map( item => [ item.id, item ] ) );
	const nextIds = new Set( next.map( item => item.id ) );

	const merged = next.map( item => {
		const previousItem = previousById.get( item.id );
		if ( ! previousItem?.registered || item.registered ) {
			return item;
		}

		return {
			...item,
			registered: true,
			label: previousItem.label,
			menuSlug: previousItem.menuSlug,
		};
	} );

	previous.forEach( item => {
		if ( item.registered && ! nextIds.has( item.id ) ) {
			merged.push( item );
		}
	} );

	return merged;
};

const getResolvedLayout = ( model: AdminMenuModel ): AdminMenuLayout => ( {
	items: model.items.reduce< AdminMenuLayout[ 'items' ] >( ( items, item ) => {
		items[ item.id ] = { hidden: item.hidden, order: item.order };
		return items;
	}, {} ),
	separators: { ...model.separators },
} );

const getInitialModel = () =>
	normalizeModel(
		getMyJetpackWindowInitialState( 'adminMenuCustomization' ) as
			| Partial< AdminMenuModel >
			| undefined
	);

const getLockedDescription = ( node: MenuItemNode ) => {
	if ( node.id === 'my-jetpack' ) {
		return __( 'Always first', 'jetpack-my-jetpack' );
	}
	if ( node.id === 'settings' ) {
		return __( 'Always here', 'jetpack-my-jetpack' );
	}

	return __( 'Off-site destination', 'jetpack-my-jetpack' );
};

type MenuItemRowProps = {
	canMoveDown: boolean;
	canMoveUp: boolean;
	disabled: boolean;
	highlighted: boolean;
	node: MenuItemNode;
	onMove: ( id: string, direction: -1 | 1 ) => void;
	onVisibilityChange: ( id: string, visible: boolean ) => void;
};

/**
 * Render a registered Jetpack menu item.
 *
 * @param props - Row properties.
 * @return The menu item row.
 */
function MenuItemRow( props: MenuItemRowProps ) {
	const { canMoveDown, canMoveUp, disabled, highlighted, node, onMove, onVisibilityChange } = props;
	const editable = ! node.locked;

	return (
		<div
			className={ `${ styles.row } ${
				editable ? styles[ 'row-editable' ] : styles[ 'row-locked' ]
			} ${ highlighted ? styles[ 'row-highlighted' ] : '' }` }
			data-menu-node-id={ node.id }
			data-menu-node-editable={ editable || undefined }
			data-newly-activated={ highlighted || undefined }
			tabIndex={ highlighted ? -1 : undefined }
			role="listitem"
			aria-label={ node.label }
		>
			<div className={ styles[ 'row-leading' ] }>
				{ editable ? (
					<IconButton
						className={ styles[ 'drag-handle' ] }
						icon={ dragHandle }
						label={ sprintf(
							/* translators: %s is a menu item name. */
							__( 'Drag %s', 'jetpack-my-jetpack' ),
							node.label
						) }
						disabled={ disabled }
						size="compact"
						variant="minimal"
					/>
				) : (
					<span className={ styles[ 'lock-icon' ] } aria-hidden="true">
						<Icon icon={ lock } size={ 18 } />
					</span>
				) }
			</div>

			<div className={ styles[ 'row-copy' ] }>
				<Text variant="body-md" className={ styles[ 'row-title' ] }>
					{ node.label }
				</Text>
				{ node.locked && (
					<Text variant="body-sm" className={ styles[ 'row-description' ] }>
						{ getLockedDescription( node ) }
					</Text>
				) }
			</div>

			{ editable && (
				<div className={ styles[ 'visibility-control' ] }>
					<Checkbox
						aria-label={ sprintf(
							/* translators: %s is a menu item name. */
							__( 'Show %s in menu', 'jetpack-my-jetpack' ),
							node.label
						) }
						checked={ ! node.hidden }
						disabled={ disabled }
						onCheckedChange={ checked => onVisibilityChange( node.id, checked === true ) }
					/>
					<Text variant="body-sm">{ __( 'Show', 'jetpack-my-jetpack' ) }</Text>
				</div>
			) }

			{ editable && (
				<div className={ styles[ 'row-actions' ] }>
					<IconButton
						icon={ arrowUp }
						label={ sprintf(
							/* translators: %s is a menu item name. */
							__( 'Move %s up', 'jetpack-my-jetpack' ),
							node.label
						) }
						disabled={ disabled || ! canMoveUp }
						onClick={ () => onMove( node.id, -1 ) }
						size="compact"
						variant="minimal"
					/>
					<IconButton
						icon={ arrowDown }
						label={ sprintf(
							/* translators: %s is a menu item name. */
							__( 'Move %s down', 'jetpack-my-jetpack' ),
							node.label
						) }
						disabled={ disabled || ! canMoveDown }
						onClick={ () => onMove( node.id, 1 ) }
						size="compact"
						variant="minimal"
					/>
				</div>
			) }
		</div>
	);
}

type SeparatorRowProps = {
	canMoveDown: boolean;
	canMoveUp: boolean;
	disabled: boolean;
	node: Extract< MenuNode, { type: 'separator' } >;
	onMove: ( id: string, direction: -1 | 1 ) => void;
	onRemove: ( id: string ) => void;
	onTitleChange: ( id: string, title: string ) => void;
};

/**
 * Render a protected or custom separator row.
 *
 * @param props - Row properties.
 * @return The separator row.
 */
function SeparatorRow( props: SeparatorRowProps ) {
	const { canMoveDown, canMoveUp, disabled, node, onMove, onRemove, onTitleChange } = props;
	if ( node.base ) {
		return (
			<div
				className={ `${ styles.row } ${ styles[ 'separator-row' ] } ${ styles[ 'row-locked' ] }` }
				data-menu-node-id={ node.id }
				role="listitem"
			>
				<span className={ styles[ 'separator-rule' ] } aria-hidden="true" />
				<div className={ styles[ 'row-copy' ] }>
					<Text variant="body-sm" className={ styles[ 'base-separator-label' ] }>
						{ __( 'Base separator', 'jetpack-my-jetpack' ) }
					</Text>
					<Text variant="body-sm" className={ styles[ 'row-description' ] }>
						{ __( 'Keeps products together', 'jetpack-my-jetpack' ) }
					</Text>
				</div>
				<span className={ styles[ 'lock-icon' ] } aria-hidden="true">
					<Icon icon={ lock } size={ 18 } />
				</span>
			</div>
		);
	}

	return (
		<div
			className={ `${ styles.row } ${ styles[ 'separator-row' ] } ${ styles[ 'row-editable' ] }` }
			data-menu-node-id={ node.id }
			data-menu-node-editable
			role="listitem"
		>
			<IconButton
				className={ styles[ 'drag-handle' ] }
				icon={ dragHandle }
				label={ __( 'Drag separator', 'jetpack-my-jetpack' ) }
				disabled={ disabled }
				size="compact"
				variant="minimal"
			/>
			<div className={ styles[ 'separator-input' ] }>
				<InputControl
					label={ __( 'Separator title (optional)', 'jetpack-my-jetpack' ) }
					value={ node.title }
					disabled={ disabled }
					onValueChange={ value => onTitleChange( node.id, String( value ?? '' ) ) }
				/>
			</div>
			<div className={ styles[ 'row-actions' ] }>
				<IconButton
					icon={ arrowUp }
					label={ __( 'Move separator up', 'jetpack-my-jetpack' ) }
					disabled={ disabled || ! canMoveUp }
					onClick={ () => onMove( node.id, -1 ) }
					size="compact"
					variant="minimal"
				/>
				<IconButton
					icon={ arrowDown }
					label={ __( 'Move separator down', 'jetpack-my-jetpack' ) }
					disabled={ disabled || ! canMoveDown }
					onClick={ () => onMove( node.id, 1 ) }
					size="compact"
					variant="minimal"
				/>
				<IconButton
					icon={ trash }
					label={ __( 'Remove separator', 'jetpack-my-jetpack' ) }
					disabled={ disabled }
					onClick={ () => onRemove( node.id ) }
					size="compact"
					tone="neutral"
					variant="minimal"
				/>
			</div>
		</div>
	);
}

/**
 * My Jetpack Customize tab content.
 *
 * @return The rendered component.
 */
export function CustomizeContent() {
	const initialModel = useMemo( () => getInitialModel(), [] );
	const { data: products, refetch: refetchProducts } = useAllProducts();
	const { modules } = useAllJetpackModules();
	const initialSequenceRef = useRef< MenuNode[] >();
	if ( ! initialSequenceRef.current ) {
		const initialCatalogState = getMenuCatalogState( initialModel.items, products, modules );
		initialSequenceRef.current = buildMenuSequence(
			initialCatalogState.activeItems,
			initialModel.separators
		);
	}
	const initialSequence = initialSequenceRef.current;
	const itemListRef = useRef< HTMLDivElement | null >( null );
	const previewRef = useRef< JetpackMenuPreview | null >( null );
	const sortableRef = useRef< SortableCollection | null >( null );
	const separatorCounter = useRef( 0 );
	const [ model, setModel ] = useState( initialModel );
	const modelRef = useRef( initialModel );
	const productsRef = useRef( products );
	const modulesRef = useRef( modules );
	const optimisticActiveIdsRef = useRef< Set< string > >( new Set() );
	const [ baseline, setBaseline ] = useState( initialSequence );
	const [ draft, setDraft ] = useState( initialSequence );
	const [ view, setView ] = useState< 'active' | 'inactive' >( 'active' );
	const [ optimisticActiveIds, setOptimisticActiveIds ] = useState< Set< string > >( new Set() );
	const [ highlightedItemId, setHighlightedItemId ] = useState< string | null >( null );
	const [ isLoading, setIsLoading ] = useState( initialModel.featureEnabled );
	const [ savingScope, setSavingScope ] = useState< 'site' | 'user' | null >( null );
	const [ loadFailed, setLoadFailed ] = useState( false );
	const [ notice, setNotice ] = useState< NoticeState | null >( null );
	const [ announcement, setAnnouncement ] = useState( '' );
	const userIsAdminValue = getMyJetpackWindowInitialState( 'userIsAdmin' ) as unknown;
	const userIsAdmin = userIsAdminValue === true || userIsAdminValue === '1';
	const isSaving = savingScope !== null;
	const isDirty = hasDraftChanged( baseline, draft );
	const editingDisabled = isSaving || loadFailed;
	const editingDisabledRef = useRef( editingDisabled );
	editingDisabledRef.current = editingDisabled;
	productsRef.current = products;
	modulesRef.current = modules;
	optimisticActiveIdsRef.current = optimisticActiveIds;
	const catalogState = useMemo(
		() => getMenuCatalogState( model.items, products, modules, optimisticActiveIds ),
		[ model.items, modules, optimisticActiveIds, products ]
	);
	let statusMessage: string = __( 'Menu is up to date', 'jetpack-my-jetpack' );
	if ( isLoading ) {
		statusMessage = __( 'Loading menu…', 'jetpack-my-jetpack' );
	} else if ( isDirty ) {
		statusMessage = __( 'Unsaved changes', 'jetpack-my-jetpack' );
	}

	const applyCanonicalModel = useCallback( ( nextValue: AdminMenuModel ) => {
		const normalizedModel = normalizeModel( nextValue );
		const nextModel = {
			...normalizedModel,
			items: mergeCanonicalItems( modelRef.current.items, normalizedModel.items ),
		};
		const nextCatalog = getMenuCatalogState(
			nextModel.items,
			productsRef.current,
			modulesRef.current,
			optimisticActiveIdsRef.current
		);
		const nextSequence = buildMenuSequence( nextCatalog.activeItems, nextModel.separators );
		modelRef.current = nextModel;
		setModel( nextModel );
		setBaseline( nextSequence );
		setDraft( nextSequence );
		previewRef.current?.apply( nextSequence );
		previewRef.current?.commit();
	}, [] );

	useEffect( () => {
		if ( isDirty ) {
			return;
		}

		const currentIds = draft
			.filter( node => node.type === 'item' )
			.map( node => node.id )
			.join( ',' );
		const nextSequence = buildMenuSequence( catalogState.activeItems, model.separators );
		const nextIds = nextSequence
			.filter( node => node.type === 'item' )
			.map( node => node.id )
			.join( ',' );
		if ( currentIds === nextIds ) {
			return;
		}

		setBaseline( nextSequence );
		setDraft( nextSequence );
	}, [ catalogState.activeItems, draft, isDirty, model.separators ] );

	useEffect( () => {
		if ( ! highlightedItemId || view !== 'active' ) {
			return;
		}

		itemListRef.current
			?.querySelector< HTMLElement >( `[data-menu-node-id="${ highlightedItemId }"]` )
			?.focus();
	}, [ draft, highlightedItemId, view ] );

	useEffect( () => {
		if ( ! initialModel.featureEnabled ) {
			return;
		}

		const preview = createJetpackMenuPreview();
		previewRef.current = preview;
		preview.apply( initialSequence );

		return () => {
			preview.restore();
			previewRef.current = null;
		};
	}, [ initialModel.featureEnabled, initialSequence ] );

	useEffect( () => {
		previewRef.current?.apply( draft );
	}, [ draft ] );

	useEffect( () => {
		if ( ! initialModel.featureEnabled ) {
			return;
		}

		let cancelled = false;
		setIsLoading( true );
		apiFetch< AdminMenuModel >( { path: REST_API_ADMIN_MENU_CUSTOMIZATION } )
			.then( nextModel => {
				if ( ! cancelled ) {
					applyCanonicalModel( nextModel );
				}
			} )
			.catch( () => {
				if ( ! cancelled ) {
					setLoadFailed( true );
					setNotice( {
						intent: 'error',
						message: __(
							'Your menu could not be loaded. Reload this page to try again.',
							'jetpack-my-jetpack'
						),
					} );
				}
			} )
			.finally( () => {
				if ( ! cancelled ) {
					setIsLoading( false );
				}
			} );

		return () => {
			cancelled = true;
		};
	}, [ applyCanonicalModel, initialModel.featureEnabled ] );

	const reorderDraft = useCallback( ( orderedIds: string[] ) => {
		setDraft( current => reorderEditableNodes( current, orderedIds ) );
	}, [] );

	useEffect( () => {
		const listElement = itemListRef.current;
		const sortable = window.jQuery;
		if ( view !== 'active' || ! listElement || ! sortable ) {
			return;
		}

		const sortableList = sortable( listElement );
		if ( typeof sortableList.sortable !== 'function' ) {
			return;
		}

		sortableList.sortable( {
			cancel: 'input, textarea, button:not([class*="drag-handle"])',
			containment: listElement,
			cursor: 'move',
			forcePlaceholderSize: true,
			handle: `.${ styles[ 'drag-handle' ] }`,
			items: '[data-menu-node-editable]',
			placeholder: styles[ 'row-placeholder' ],
			tolerance: 'pointer',
			update: () => {
				const orderedIds = Array.from(
					listElement.querySelectorAll< HTMLElement >( '[data-menu-node-editable]' )
				)
					.map( row => row.dataset.menuNodeId )
					.filter( Boolean ) as string[];
				reorderDraft( orderedIds );
			},
		} );
		sortableRef.current = sortableList;
		sortableList.sortable( 'option', 'disabled', editingDisabledRef.current );

		return () => {
			sortableList.sortable( 'destroy' );
			if ( sortableRef.current === sortableList ) {
				sortableRef.current = null;
			}
		};
	}, [ reorderDraft, view ] );

	useEffect( () => {
		sortableRef.current?.sortable( 'option', 'disabled', editingDisabled );
	}, [ editingDisabled ] );

	const editableIds = useMemo(
		() => draft.filter( node => ! node.locked ).map( node => node.id ),
		[ draft ]
	);

	const moveNode = useCallback( ( id: string, direction: -1 | 1 ) => {
		setDraft( current => {
			const nextDraft = moveEditableNode( current, id, direction );
			if ( nextDraft !== current ) {
				const node = nextDraft.find( candidate => candidate.id === id );
				const label = node?.type === 'item' ? node.label : __( 'Separator', 'jetpack-my-jetpack' );
				setAnnouncement(
					sprintf(
						/* translators: 1: row name, 2: direction. */
						__( '%1$s moved %2$s.', 'jetpack-my-jetpack' ),
						label,
						direction < 0 ? __( 'up', 'jetpack-my-jetpack' ) : __( 'down', 'jetpack-my-jetpack' )
					)
				);
			}
			return nextDraft;
		} );
	}, [] );

	const addSeparator = useCallback( () => {
		const id = `custom-${ Date.now() }-${ separatorCounter.current++ }`;
		setDraft( current => addCustomSeparator( current, id ) );
		setAnnouncement( __( 'Separator added.', 'jetpack-my-jetpack' ) );
	}, [] );

	const alphabetizeSections = useCallback( () => {
		setDraft( current => alphabetizeMenuSections( current ) );
		setAnnouncement( __( 'Product sections alphabetized.', 'jetpack-my-jetpack' ) );
	}, [] );

	const handleProductActivated = useCallback(
		( item: AdminMenuItem ) => {
			const nextOptimisticIds = new Set( optimisticActiveIdsRef.current );
			nextOptimisticIds.add( item.id );
			optimisticActiveIdsRef.current = nextOptimisticIds;
			setOptimisticActiveIds( nextOptimisticIds );

			const nextItems = insertActivatedItem( modelRef.current.items, item );
			const nextModel = { ...modelRef.current, items: nextItems };
			modelRef.current = nextModel;
			setModel( nextModel );
			const nextCatalog = getMenuCatalogState(
				nextItems,
				productsRef.current,
				modulesRef.current,
				nextOptimisticIds
			);
			setDraft( buildMenuSequence( nextCatalog.activeItems, nextModel.separators ) );
			setHighlightedItemId( item.id );
			setView( 'active' );
			setNotice( {
				intent: 'success',
				message: sprintf(
					/* translators: %s is a product name. */
					__( '%s was activated and added to your menu.', 'jetpack-my-jetpack' ),
					item.label
				),
			} );
			void refetchProducts();
		},
		[ refetchProducts ]
	);

	const handleProductActivationError = useCallback( ( item: AdminMenuItem ) => {
		setNotice( {
			intent: 'error',
			message: sprintf(
				/* translators: %s is a product name. */
				__( '%s could not be activated. Try again.', 'jetpack-my-jetpack' ),
				item.label
			),
		} );
	}, [] );

	const saveLayout = useCallback(
		( scope: 'site' | 'user' ) => {
			const previousLayout = scope === 'site' ? model.siteLayout : getResolvedLayout( model );
			const layout = serializeDraftLayout( draft, previousLayout );
			const snapshot = scope === 'site' ? { ...layout, enabled: true } : layout;
			setSavingScope( scope );
			setNotice( null );

			apiFetch< AdminMenuModel >( {
				path: REST_API_ADMIN_MENU_CUSTOMIZATION,
				method: 'POST',
				data: { scope, layout: snapshot },
			} )
				.then( nextModel => {
					applyCanonicalModel( nextModel );
					setNotice( {
						intent: 'success',
						message:
							scope === 'site'
								? __( 'Site default was updated.', 'jetpack-my-jetpack' )
								: __( 'My menu was saved.', 'jetpack-my-jetpack' ),
					} );
				} )
				.catch( () => {
					setNotice( {
						intent: 'error',
						message:
							scope === 'site'
								? __(
										'Site defaults could not be updated. Your changes are still here.',
										'jetpack-my-jetpack'
								  )
								: __(
										'Your menu could not be saved. Your changes are still here.',
										'jetpack-my-jetpack'
								  ),
					} );
				} )
				.finally( () => setSavingScope( null ) );
		},
		[ applyCanonicalModel, draft, model ]
	);

	if ( ! model.featureEnabled ) {
		return (
			<Notice.Root intent="info">
				<Notice.Description>
					{ __( 'Menu customization is not available on this site.', 'jetpack-my-jetpack' ) }
				</Notice.Description>
			</Notice.Root>
		);
	}

	return (
		<div className={ styles.customize }>
			<div className={ styles.header }>
				<div>
					<h2>{ __( 'Customize my Jetpack menu', 'jetpack-my-jetpack' ) }</h2>
					<p className={ styles.intro }>
						{ __( 'Drag items and separators. Changes preview live.', 'jetpack-my-jetpack' ) }
					</p>
				</div>
				<div className={ styles[ 'draft-status' ] } role="status" aria-live="polite">
					<Text variant="body-sm">{ statusMessage }</Text>
				</div>
			</div>

			<Tabs.Root
				value={ view }
				onValueChange={ value => setView( value === 'inactive' ? 'inactive' : 'active' ) }
			>
				<Tabs.List variant="minimal" className={ styles[ 'view-tabs' ] }>
					<Tabs.Tab value="active">{ __( 'Active', 'jetpack-my-jetpack' ) }</Tabs.Tab>
					<Tabs.Tab value="inactive">{ __( 'Inactive', 'jetpack-my-jetpack' ) }</Tabs.Tab>
				</Tabs.List>
			</Tabs.Root>

			{ notice && (
				<Notice.Root intent={ notice.intent } className={ styles.notice }>
					<Notice.Description>{ notice.message }</Notice.Description>
					<Notice.CloseIcon
						label={ __( 'Dismiss notice', 'jetpack-my-jetpack' ) }
						onClick={ () => setNotice( null ) }
					/>
				</Notice.Root>
			) }

			{ view === 'active' ? (
				<Card.Root className={ styles[ 'editor-card' ] }>
					<Card.Content className={ styles[ 'editor-content' ] }>
						<div
							className={ styles[ 'menu-list' ] }
							ref={ itemListRef }
							role="list"
							aria-label={ __( 'My Jetpack menu', 'jetpack-my-jetpack' ) }
						>
							{ draft.map( node => {
								const editableIndex = editableIds.indexOf( node.id );
								const movement = {
									canMoveUp: editableIndex > 0,
									canMoveDown: editableIndex >= 0 && editableIndex < editableIds.length - 1,
								};

								return node.type === 'item' ? (
									<MenuItemRow
										key={ node.id }
										{ ...movement }
										disabled={ editingDisabled }
										highlighted={ highlightedItemId === node.id }
										node={ node }
										onMove={ moveNode }
										onVisibilityChange={ ( id, visible ) =>
											setDraft( current => updateItemVisibility( current, id, visible ) )
										}
									/>
								) : (
									<SeparatorRow
										key={ node.id }
										{ ...movement }
										disabled={ editingDisabled }
										node={ node }
										onMove={ moveNode }
										onRemove={ id => {
											setDraft( current => removeCustomSeparator( current, id ) );
											setAnnouncement( __( 'Separator removed.', 'jetpack-my-jetpack' ) );
										} }
										onTitleChange={ ( id, title ) =>
											setDraft( current => updateCustomSeparator( current, id, title ) )
										}
									/>
								);
							} ) }
						</div>

						<div className={ styles[ 'editor-tools' ] }>
							<Button
								variant="outline"
								tone="neutral"
								disabled={
									editingDisabled ||
									! draft.some( node => node.type === 'item' && ! node.external && ! node.locked )
								}
								onClick={ addSeparator }
							>
								<Icon icon={ plus } size={ 18 } />
								{ __( 'Add separator', 'jetpack-my-jetpack' ) }
							</Button>
							<Button
								variant="outline"
								tone="neutral"
								disabled={
									editingDisabled ||
									! draft.some( node => node.type === 'item' && ! node.external && ! node.locked )
								}
								onClick={ alphabetizeSections }
							>
								{ __( 'Alphabetize sections', 'jetpack-my-jetpack' ) }
							</Button>
						</div>

						<Stack className={ styles.actions } direction="row" gap="sm" wrap="wrap">
							<Button
								loading={ savingScope === 'user' }
								loadingAnnouncement={ __( 'Saving my menu', 'jetpack-my-jetpack' ) }
								disabled={ editingDisabled || ( ! isDirty && model.hasPersonalLayout ) }
								onClick={ () => saveLayout( 'user' ) }
							>
								{ __( 'Save my menu', 'jetpack-my-jetpack' ) }
							</Button>
							{ userIsAdmin && (
								<Button
									variant="outline"
									tone="neutral"
									loading={ savingScope === 'site' }
									loadingAnnouncement={ __( 'Updating site default', 'jetpack-my-jetpack' ) }
									disabled={ editingDisabled }
									onClick={ () => saveLayout( 'site' ) }
								>
									{ __( 'Set as site default', 'jetpack-my-jetpack' ) }
								</Button>
							) }
						</Stack>
					</Card.Content>
				</Card.Root>
			) : (
				<Card.Root className={ styles[ 'editor-card' ] }>
					<Card.Content className={ styles[ 'editor-content' ] }>
						<div className={ styles[ 'inactive-intro' ] }>
							<Text variant="body-md">
								{ __(
									'Explore products that are not currently in your Jetpack menu. Activate one to add it below My Jetpack.',
									'jetpack-my-jetpack'
								) }
							</Text>
						</div>
						<div
							className={ styles[ 'inactive-list' ] }
							role="list"
							aria-label={ __( 'Inactive Jetpack products', 'jetpack-my-jetpack' ) }
						>
							{ catalogState.inactiveItems.length > 0 ? (
								catalogState.inactiveItems.map( item => {
									const product = item.productSlug ? products[ item.productSlug ] : undefined;
									const moduleSlug = item.productSlug
										? getMenuProductModuleSlug( item.productSlug )
										: '';

									return (
										<InactiveProductRow
											key={ item.id }
											canManage={ userIsAdmin }
											item={ item }
											module={ modules[ moduleSlug ] }
											product={ product }
											onActivated={ handleProductActivated }
											onActivationError={ handleProductActivationError }
										/>
									);
								} )
							) : (
								<div className={ styles[ 'inactive-empty' ] }>
									<Text variant="body-md">
										{ __( 'All available products are active.', 'jetpack-my-jetpack' ) }
									</Text>
								</div>
							) }
						</div>
					</Card.Content>
				</Card.Root>
			) }

			<div className={ styles[ 'screen-reader-status' ] } aria-live="polite" aria-atomic="true">
				{ announcement }
			</div>
		</div>
	);
}
