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
	Text,
} from '@wordpress/ui';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { REST_API_ADMIN_MENU_CUSTOMIZATION } from '../../../data/constants';
import { getMyJetpackWindowInitialState } from '../../../data/utils/get-my-jetpack-window-state';
import { createJetpackMenuPreview, type JetpackMenuPreview } from './live-preview';
import {
	addCustomSeparator,
	buildMenuSequence,
	hasDraftChanged,
	moveEditableNode,
	removeCustomSeparator,
	reorderEditableNodes,
	serializeDraftLayout,
	updateCustomSeparator,
	updateItemVisibility,
} from './menu-sequence';
import styles from './styles.module.scss';
import type { AdminMenuLayout, AdminMenuModel, MenuItemNode, MenuNode, NoticeState } from './types';

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
	} ) ),
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
	const { canMoveDown, canMoveUp, disabled, node, onMove, onVisibilityChange } = props;
	const editable = ! node.locked;

	return (
		<div
			className={ `${ styles.row } ${
				editable ? styles[ 'row-editable' ] : styles[ 'row-locked' ]
			}` }
			data-menu-node-id={ node.id }
			data-menu-node-editable={ editable || undefined }
			role="listitem"
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
	const initialSequence = useMemo(
		() => buildMenuSequence( initialModel.items, initialModel.separators ),
		[ initialModel ]
	);
	const itemListRef = useRef< HTMLDivElement | null >( null );
	const previewRef = useRef< JetpackMenuPreview | null >( null );
	const separatorCounter = useRef( 0 );
	const [ model, setModel ] = useState( initialModel );
	const [ baseline, setBaseline ] = useState( initialSequence );
	const [ draft, setDraft ] = useState( initialSequence );
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
	let statusMessage: string = __( 'Menu is up to date', 'jetpack-my-jetpack' );
	if ( isLoading ) {
		statusMessage = __( 'Loading menu…', 'jetpack-my-jetpack' );
	} else if ( isDirty ) {
		statusMessage = __( 'Unsaved changes', 'jetpack-my-jetpack' );
	}

	const applyCanonicalModel = useCallback( ( nextValue: AdminMenuModel ) => {
		const nextModel = normalizeModel( nextValue );
		const nextSequence = buildMenuSequence( nextModel.items, nextModel.separators );
		setModel( nextModel );
		setBaseline( nextSequence );
		setDraft( nextSequence );
		previewRef.current?.apply( nextSequence );
		previewRef.current?.commit();
	}, [] );

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
		if ( ! listElement || ! sortable || editingDisabled ) {
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

		return () => {
			sortableList.sortable( 'destroy' );
		};
	}, [ draft, editingDisabled, reorderDraft ] );

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

	const saveLayout = useCallback(
		( scope: 'site' | 'user' ) => {
			const layout = serializeDraftLayout( draft );
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
		[ applyCanonicalModel, draft ]
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

			{ notice && (
				<Notice.Root intent={ notice.intent } className={ styles.notice }>
					<Notice.Description>{ notice.message }</Notice.Description>
					<Notice.CloseIcon
						label={ __( 'Dismiss notice', 'jetpack-my-jetpack' ) }
						onClick={ () => setNotice( null ) }
					/>
				</Notice.Root>
			) }

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

					<div className={ styles[ 'add-action' ] }>
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

			<div className={ styles[ 'screen-reader-status' ] } aria-live="polite" aria-atomic="true">
				{ announcement }
			</div>
		</div>
	);
}
