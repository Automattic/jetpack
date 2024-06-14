import { Button } from '@wordpress/components';
import { memo, useCallback, useState, useRef, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { UP, DOWN, LEFT, RIGHT, SPACE, ENTER } from '@wordpress/keycodes';
import clsx from 'clsx';
import { debounce } from 'lodash';
import MediaItem from './media-item';
import MediaPlaceholder from './placeholder';

const MAX_SELECTED = 10;

const EmptyResults = memo( () => (
	<div className="jetpack-external-media-browser__empty">
		<p>{ __( 'Sorry, but nothing matched your search criteria.', 'jetpack' ) }</p>
	</div>
) );

function MediaBrowser( props ) {
	const {
		media,
		isCopying,
		isLoading,
		pageHandle,
		className,
		multiple,
		setPath,
		nextPage,
		onCopy,
		selectButtonText,
	} = props;
	const [ selected, setSelected ] = useState( [] );
	const [ focused, setFocused ] = useState( -1 );

	const columns = useRef( -1 );
	const gridEl = useRef( null );

	const select = useCallback(
		newlySelected => {
			let newSelected = [ newlySelected ];

			if ( newlySelected.type === 'folder' ) {
				setPath( newlySelected.ID );
			} else if ( multiple ) {
				newSelected = selected.slice( 0, MAX_SELECTED - 1 ).concat( newlySelected );

				if ( selected.find( item => newlySelected.ID === item.ID ) ) {
					newSelected = selected.filter( item => item.ID !== newlySelected.ID );
				}
			} else if ( selected.length === 1 && newlySelected.ID === selected[ 0 ].ID ) {
				newSelected = [];
			}

			setSelected( newSelected );
		},
		[ selected, multiple, setPath ]
	);

	const onCopyAndInsert = useCallback( () => {
		onCopy( selected );
	}, [ selected, onCopy ] );

	const hasMediaItems = media.filter( item => item.type !== 'folder' ).length > 0;
	const classes = clsx( {
		'jetpack-external-media-browser__media': true,
		'jetpack-external-media-browser__media__loading': isLoading,
	} );
	const wrapper = clsx( {
		'jetpack-external-media-browser': true,
		[ className ]: true,
	} );

	const onLoadMoreClick = () => {
		if ( media.length ) {
			setFocused( media.length );
		}
		nextPage();
	};

	const navigate = ( keyCode, index ) => {
		switch ( keyCode ) {
			case LEFT:
				if ( index >= 1 ) {
					setFocused( index - 1 );
				}
				break;
			case RIGHT:
				if ( index < media.length ) {
					setFocused( index + 1 );
				}
				break;
			case UP:
				if ( index >= columns.current ) {
					setFocused( index - columns.current );
				}
				break;
			case DOWN:
				if ( index < media.length - columns.current ) {
					setFocused( index + columns.current );
				}
				break;
		}
	};

	/**
	 * Counts how many items are in a row by checking how many of the grid's child
	 * items have a matching offsetTop.
	 */
	const checkColumns = () => {
		let perRow = 1;

		const items = gridEl.current.children;

		if ( items.length > 0 ) {
			const firstOffset = items[ 0 ].offsetTop;

			/**
			 * Check how many items have a matching offsetTop. This will give us the
			 * total number of items in a row.
			 */
			while ( perRow < items.length && items[ perRow ].offsetTop === firstOffset ) {
				++perRow;
			}
		}

		columns.current = perRow;
	};

	const checkColumnsDebounced = debounce( checkColumns, 400 );

	useEffect( () => {
		// Re-set columns on window resize:
		window.addEventListener( 'resize', checkColumnsDebounced );
		return () => {
			window.removeEventListener( 'resize', checkColumnsDebounced );
		};
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect( () => {
		// Set columns value once when media are loaded.
		if ( media.length && columns.current === -1 ) {
			checkColumns();
		}
	}, [ media ] );

	// Using _event to avoid eslint errors. Can change to event if it's in use again.
	const handleMediaItemClick = ( _event, { item } ) => {
		select( item );
	};

	const handleMediaItemKeyDown = ( event, { item, index } ) => {
		if ( [ LEFT, RIGHT, UP, DOWN ].includes( event.keyCode ) ) {
			navigate( event.keyCode, index );
		} else if ( SPACE === event.keyCode ) {
			select( item );
			event.preventDefault(); // Prevent space from scrolling the page down.
		} else if ( ENTER === event.keyCode ) {
			select( item );
		}

		if ( [ LEFT, RIGHT, UP, DOWN, SPACE, ENTER ].includes( event.keyCode ) ) {
			event.stopPropagation();
		}
	};

	const SelectButton = selectProps => {
		const disabled = selected.length === 0 || isCopying;
		const defaultLabel = selectProps?.labelText
			? selectProps?.labelText( selected.length )
			: __( 'Select', 'jetpack', /* dummy arg to avoid bad minification */ 0 );

		const label = isCopying ? __( 'Inserting…', 'jetpack' ) : defaultLabel;

		return (
			<div className="jetpack-external-media-browser__media__toolbar">
				<Button
					variant="primary"
					isBusy={ isCopying }
					disabled={ disabled }
					onClick={ onCopyAndInsert }
				>
					{ label }
				</Button>
			</div>
		);
	};

	return (
		<div className={ wrapper }>
			<ul ref={ gridEl } className={ classes }>
				{ media.map( ( item, index ) => (
					<MediaItem
						item={ item }
						index={ index }
						key={ item.ID }
						onClick={ handleMediaItemClick }
						onKeyDown={ handleMediaItemKeyDown }
						focus={ index === focused }
						isSelected={ selected.find( toFind => toFind.ID === item.ID ) }
						isCopying={ isCopying }
					/>
				) ) }

				{ media.length === 0 && ! isLoading && <EmptyResults /> }
				{ isLoading && <MediaPlaceholder /> }

				{ pageHandle && ! isLoading && (
					<Button
						variant="secondary"
						className="jetpack-external-media-browser__loadmore"
						disabled={ isLoading || isCopying }
						onClick={ onLoadMoreClick }
					>
						{ __( 'Load More', 'jetpack' ) }
					</Button>
				) }
			</ul>

			{ hasMediaItems && <SelectButton labelText={ selectButtonText } /> }
		</div>
	);
}

export default MediaBrowser;
