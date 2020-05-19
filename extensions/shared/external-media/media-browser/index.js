/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { memo, useCallback, useState } from '@wordpress/element';
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
		<p>{ __( 'We found nothing.', 'jetpack' ) }</p>
	</div>
) );

function MediaBrowser( props ) {
	const { media, isLoading, pageHandle, className, multiple, setPath, nextPage, onCopy } = props;
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

	return (
		<div className={ wrapper }>
			<div className={ classes }>
				{ media.map( item => (
					<MediaItem
						item={ item }
						key={ item.ID }
						onClick={ onSelectImage }
						isSelected={ selected.find( toFind => toFind.ID === item.ID ) }
					/>
				) ) }

				{ media.length === 0 && ! isLoading && <EmptyResults /> }
				{ isLoading && <MediaPlaceholder /> }

				{ pageHandle && ! isLoading && (
					<Button
						isLarge
						isSecondary
						className="jetpack-external-media-browser__loadmore"
						disabled={ isLoading }
						onClick={ nextPage }
					>
						{ __( 'Load More', 'jetpack' ) }
					</Button>
				) }
			</div>

			{ hasMediaItems && (
				<div className="jetpack-external-media-browser__media__toolbar">
					<Button isPrimary isLarge disabled={ selected.length === 0 } onClick={ onCopyAndInsert }>
						{ __( 'Copy & Insert', 'jetpack' ) }
					</Button>
				</div>
			) }
		</div>
	);
}

export default MediaBrowser;
