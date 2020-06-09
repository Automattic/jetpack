/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { memo, useCallback, useState, useRef } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import MediaPlaceholder from './placeholder';
import MediaItem from './media-item';

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
	} = props;
	const [ selected, setSelected ] = useState( [] );

	const onSelectImage = useCallback(
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
	const classes = classnames( {
		'jetpack-external-media-browser__media': true,
		'jetpack-external-media-browser__media__loading': isLoading,
	} );
	const wrapper = classnames( {
		'jetpack-external-media-browser': true,
		[ className ]: true,
	} );

	const prevMediaCount = useRef( 0 );

	const onLoadMoreClick = () => {
		prevMediaCount.current = media.length;
		nextPage();
	};

	const SelectButton = () => {
		const disabled = selected.length === 0 || isCopying;
		const label = isCopying ? __( 'Inserting…', 'jetpack' ) : __( 'Select', 'jetpack' );

		return (
			<div className="jetpack-external-media-browser__media__toolbar">
				<Button
					isPrimary
					isLarge
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
			<div role="presentation" className={ classes }>
				{ media.map( ( item, index ) => (
					<MediaItem
						item={ item }
						key={ item.ID }
						onClick={ onSelectImage }
						focusOnMount={ !! prevMediaCount.current && index === prevMediaCount.current }
						isSelected={ selected.find( toFind => toFind.ID === item.ID ) }
						isCopying={ isCopying }
					/>
				) ) }

				{ media.length === 0 && ! isLoading && <EmptyResults /> }
				{ isLoading && <MediaPlaceholder /> }
			</div>

			{ pageHandle && ! isLoading && (
				<Button
					isLarge
					isSecondary
					className="jetpack-external-media-browser__loadmore"
					disabled={ isLoading }
					onClick={ onLoadMoreClick }
				>
					{ __( 'Load More', 'jetpack' ) }
				</Button>
			) }

			{ hasMediaItems && <SelectButton /> }
		</div>
	);
}

export default MediaBrowser;
