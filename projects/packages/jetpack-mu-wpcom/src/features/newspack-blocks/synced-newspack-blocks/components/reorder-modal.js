/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import { speak } from '@wordpress/a11y';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import {
	Button,
	Modal,
	Notice,
	Spinner,
	__experimentalConfirmDialog as ConfirmDialog, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { Icon, chevronDown, chevronUp, close, dragHandle } from '@wordpress/icons';
import { Card } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import './reorder-modal.scss';

export const moveItem = ( items, from, to ) => {
	if ( from === to || from < 0 || to < 0 || from >= items.length || to >= items.length ) {
		return items;
	}
	const next = [ ...items ];
	const [ moved ] = next.splice( from, 1 );
	next.splice( to, 0, moved );
	return next;
};

const OVERLAY_SELECTOR = '.components-modal__screen-overlay';

// The overlay carries the dismissal handling and the drop target, and `Modal`
// forwards its ref to it today. Deriving it from whatever node arrives keeps
// both working if core ever forwards that ref somewhere else.
export const findOverlay = node =>
	node?.closest?.( OVERLAY_SELECTOR ) ||
	node?.querySelector?.( OVERLAY_SELECTOR ) ||
	node?.ownerDocument?.querySelector( OVERLAY_SELECTOR ) ||
	null;

// Disabled controls stay focusable here, so they report `aria-disabled` rather
// than the native attribute.
const isAvailable = button => !! button && ! button.matches( ':disabled, [aria-disabled="true"]' );

// Speech input matches on the visible label, so it has to open the accessible
// name. Composing both from one translated string keeps that true in every locale.
const nameWithTitle = ( label, title ) =>
	sprintf(
		/* translators: keep %1$s first: it repeats the button's visible label, which speech input matches on. 1: the control's visible label. 2: title of the content being moved. */
		__( '%1$s: %2$s', 'jetpack-mu-wpcom' ),
		label,
		title
	);

const ReorderModal = ( { title, ids, fetchItems, onSave, onClose } ) => {
	const moveUpLabel = __( 'Move Up', 'jetpack-mu-wpcom' );
	const moveDownLabel = __( 'Move Down', 'jetpack-mu-wpcom' );
	const [ items, setItems ] = useState( null );
	const [ dragIndex, setDragIndex ] = useState( null );
	const [ hasFetchError, setHasFetchError ] = useState( false );
	const [ isConfirmingDiscard, setIsConfirmingDiscard ] = useState( false );
	const listRef = useRef( null );
	const overlayRef = useRef( null );
	const pendingFocus = useRef( null );
	const closeRef = useRef( null );
	const preDragItems = useRef( null );
	const dragBlocked = useRef( false );
	const captureOverlay = useCallback( node => {
		overlayRef.current = findOverlay( node );
	}, [] );

	// The order the modal opened with. Snapshotted so a change to `ids` from
	// elsewhere in the editor cannot desynchronise it from `items`.
	const openedWith = useRef( ids );

	const isDirty = !! items && items.some( ( item, index ) => item.id !== openedWith.current[ index ] );

	useEffect( () => {
		let cancelled = false;
		const openIds = openedWith.current;
		const withLabels = labels => openIds.map( id => ( { id, label: labels[ id ] || __( '(no title)', 'jetpack-mu-wpcom' ) } ) );

		fetchItems( openIds )
			.then( results => {
				if ( cancelled ) {
					return;
				}
				const labels = {};
				results.forEach( ( { value, label } ) => {
					labels[ value ] = label;
				} );
				const loaded = withLabels( labels );
				setItems( loaded );
				speak(
					sprintf(
						/* translators: %d: number of items in the list. */
						_n( '%d item ready to reorder.', '%d items ready to reorder.', loaded.length, 'jetpack-mu-wpcom' ),
						loaded.length
					)
				);
			} )
			.catch( error => {
				// eslint-disable-next-line no-console
				console.error( 'Newspack Blocks: could not prepare the content to reorder.', error );
				if ( ! cancelled ) {
					setHasFetchError( true );
					// Only to leave the loading state: the error view lists nothing.
					setItems( [] );
				}
			} );

		return () => {
			cancelled = true;
		};
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

	// A chevron that reaches an end of the list stops accepting moves, so send
	// focus to the row's other chevron.
	useEffect( () => {
		const pending = pendingFocus.current;
		pendingFocus.current = null;
		if ( ! pending || ! listRef.current ) {
			return;
		}
		const row = listRef.current.querySelector( `[data-item-id="${ pending.id }"]` );
		if ( ! row ) {
			return;
		}
		const preferred = row.querySelector( `[data-direction="${ pending.direction }"]` );
		const fallback = row.querySelector( `[data-direction="${ 'up' === pending.direction ? 'down' : 'up' }"]` );
		if ( isAvailable( preferred ) ) {
			preferred.focus();
		} else if ( isAvailable( fallback ) ) {
			fallback.focus();
		}
	}, [ items ] );

	const moveTo = ( from, to, direction ) => {
		const next = moveItem( items, from, to );
		if ( next === items ) {
			return;
		}
		pendingFocus.current = { id: items[ from ].id, direction };
		setItems( next );
		speak(
			sprintf(
				/* translators: 1: title of the moved item. 2: its new position. 3: total number of items. */
				__( '%1$s moved to position %2$d of %3$d.', 'jetpack-mu-wpcom' ),
				items[ from ].label,
				to + 1,
				items.length
			)
		);
	};

	const requestClose = () => {
		if ( isDirty ) {
			setIsConfirmingDiscard( true );
			return;
		}
		onClose();
	};

	useEffect( () => {
		closeRef.current = requestClose;
	}, [ requestClose ] );

	const handleKeyDown = event => {
		if ( 'Escape' !== event.key || event.defaultPrevented ) {
			return;
		}
		event.preventDefault();
		requestClose();
	};

	// `Modal` plays its exit animation before it reports a close request, which
	// would fade the modal out and back in whenever the confirmation vetoes one.
	// Its own dismissal handlers are off, so drive the overlay press here.
	useEffect( () => {
		const overlay = overlayRef.current;
		if ( ! overlay ) {
			return;
		}
		let pressedOverlay = false;
		const onPointerDown = event => {
			pressedOverlay = event.target === overlay;
			if ( pressedOverlay ) {
				event.preventDefault();
			}
		};
		const onPointerUp = event => {
			const dismisses = pressedOverlay && 0 === event.button && event.target === overlay;
			pressedOverlay = false;
			if ( dismisses ) {
				closeRef.current();
			}
		};
		overlay.addEventListener( 'pointerdown', onPointerDown );
		overlay.addEventListener( 'pointerup', onPointerUp );
		return () => {
			overlay.removeEventListener( 'pointerdown', onPointerDown );
			overlay.removeEventListener( 'pointerup', onPointerUp );
		};
	}, [] );

	// Rows are the only drop targets, and the frame's own padding is not one, so a
	// release a few pixels wide of the list would report a cancelled drag and undo
	// the reorder. Accepting the drop across the whole dialog leaves "cancelled"
	// meaning only Escape or a release outside it.
	useEffect( () => {
		const frame = overlayRef.current?.querySelector( '.components-modal__frame' );
		if ( ! frame ) {
			return;
		}
		const accept = event => event.preventDefault();
		frame.addEventListener( 'dragover', accept );
		frame.addEventListener( 'drop', accept );
		return () => {
			frame.removeEventListener( 'dragover', accept );
			frame.removeEventListener( 'drop', accept );
		};
	}, [] );

	const handleDragOver = ( event, index ) => {
		event.preventDefault();
		if ( null === dragIndex ) {
			return;
		}
		event.dataTransfer.dropEffect = 'move';
		if ( dragIndex === index ) {
			return;
		}
		setItems( moveItem( items, dragIndex, index ) );
		setDragIndex( index );
	};

	return (
		<>
			<Modal
				ref={ captureOverlay }
				title={ title }
				onRequestClose={ requestClose }
				onKeyDown={ handleKeyDown }
				isDismissible={ false }
				shouldCloseOnEsc={ false }
				shouldCloseOnClickOutside={ false }
				headerActions={ <Button size="compact" icon={ close } label={ __( 'Close', 'jetpack-mu-wpcom' ) } onClick={ requestClose } /> }
				size="medium"
				className="newspack-blocks-reorder-modal"
			>
				<div className="newspack-blocks-reorder-modal__body" aria-busy={ ! items }>
					{ ! items && (
						<div className="newspack-blocks-reorder-modal__loading">
							<Spinner />
							<span className="screen-reader-text">{ __( 'Loading content…', 'jetpack-mu-wpcom' ) }</span>
						</div>
					) }
					{ items && hasFetchError && (
						<>
							<Notice status="error" isDismissible={ false } className="newspack-blocks-reorder-modal__notice">
								{ __( 'The content could not be loaded, so the order cannot be saved.', 'jetpack-mu-wpcom' ) }
							</Notice>
							<div className="newspack-blocks-reorder-modal__footer">
								<Button variant="tertiary" onClick={ requestClose }>
									{ __( 'Cancel', 'jetpack-mu-wpcom' ) }
								</Button>
							</div>
						</>
					) }
					{ items && ! hasFetchError && (
						<>
							{ /* `list-style: none` drops list semantics in Safari, so the role is restated. */ }
							{ /* eslint-disable-next-line jsx-a11y/no-redundant-roles */ }
							<ul className="newspack-blocks-reorder-modal__list" role="list" ref={ listRef }>
								{ items.map( ( item, index ) => (
									<Card.Root
										key={ item.id }
										render={ <li /> }
										data-item-id={ item.id }
										className={ classnames( 'newspack-blocks-reorder-modal__item', {
											'is-dragging': dragIndex === index,
										} ) }
										draggable
										// `dragstart` always fires at the draggable row, never at the
										// chevron inside it, so the grab point is recorded separately.
										onPointerDown={ event => {
											dragBlocked.current = !! event.target.closest?.( 'button' );
										} }
										onDragStart={ event => {
											if ( dragBlocked.current ) {
												event.preventDefault();
												return;
											}
											preDragItems.current = items;
											// Firefox and Safari will not start a drag until the payload is set.
											event.dataTransfer.setData( 'text/plain', String( item.id ) );
											event.dataTransfer.effectAllowed = 'move';
											setDragIndex( index );
										} }
										onDragOver={ event => handleDragOver( event, index ) }
										onDragEnd={ event => {
											// A cancelled drag reports no drop effect: put the order back.
											if ( 'none' === event.dataTransfer.dropEffect && preDragItems.current ) {
												setItems( preDragItems.current );
											}
											preDragItems.current = null;
											setDragIndex( null );
										} }
										onDrop={ event => event.preventDefault() }
									>
										<span className="newspack-blocks-reorder-modal__grip" aria-hidden="true">
											<Icon icon={ dragHandle } />
										</span>
										<span className="newspack-blocks-reorder-modal__move">
											<Button
												icon={ chevronUp }
												size="small"
												data-direction="up"
												disabled={ 0 === index }
												accessibleWhenDisabled
												label={ moveUpLabel }
												aria-label={ nameWithTitle( moveUpLabel, item.label ) }
												onClick={ () => moveTo( index, index - 1, 'up' ) }
											/>
											<Button
												icon={ chevronDown }
												size="small"
												data-direction="down"
												disabled={ index === items.length - 1 }
												accessibleWhenDisabled
												label={ moveDownLabel }
												aria-label={ nameWithTitle( moveDownLabel, item.label ) }
												onClick={ () => moveTo( index, index + 1, 'down' ) }
											/>
										</span>
										<Card.Content className="newspack-blocks-reorder-modal__title" title={ item.label }>
											{ item.label }
										</Card.Content>
									</Card.Root>
								) ) }
							</ul>
							<div className="newspack-blocks-reorder-modal__footer">
								<Button variant="tertiary" onClick={ requestClose }>
									{ __( 'Cancel', 'jetpack-mu-wpcom' ) }
								</Button>
								<Button
									variant="primary"
									disabled={ ! isDirty }
									accessibleWhenDisabled
									onClick={ () => onSave( items.map( item => item.id ) ) }
								>
									{ __( 'Save', 'jetpack-mu-wpcom' ) }
								</Button>
							</div>
						</>
					) }
				</div>
			</Modal>
			{ isConfirmingDiscard && (
				<ConfirmDialog
					isOpen
					contentLabel={ __( 'Discard the new order?', 'jetpack-mu-wpcom' ) }
					confirmButtonText={ __( 'Discard', 'jetpack-mu-wpcom' ) }
					cancelButtonText={ __( 'Keep editing', 'jetpack-mu-wpcom' ) }
					onConfirm={ onClose }
					onCancel={ () => setIsConfirmingDiscard( false ) }
				>
					{ __( 'The order you set will be lost.', 'jetpack-mu-wpcom' ) }
				</ConfirmDialog>
			) }
		</>
	);
};

export default ReorderModal;
