/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { Spinner } from '@wordpress/components';

function MediaItem( props ) {
	const onClick = useCallback( () => {
		if ( props.onClick ) {
			props.onClick( props.item );
		}
	}, [ props.onClick ] );

	const { item, isSelected, isCopying = false } = props;
	const { thumbnails, caption, name, title, type, children = 0 } = item;
	const { medium = null, fmt_hd = null } = thumbnails;
	const alt = title || caption || name;
	const classes = classnames( {
		'jetpack-external-media-browser__media__item': true,
		'jetpack-external-media-browser__media__item__selected': isSelected,
		'jetpack-external-media-browser__media__folder': type === 'folder',
		'is-transient': isSelected && isCopying,
	} );

	/* eslint-disable jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions */
	return (
		<button className={ classes } onClick={ onClick }>
			<img src={ medium || fmt_hd } alt={ alt } title={ alt } />

			{ type === 'folder' && (
				<div className="jetpack-external-media-browser__media__info">
					<div className="jetpack-external-media-browser__media__name">{ name }</div>
					<div className="jetpack-external-media-browser__media__count">{ children }</div>
				</div>
			) }

			{ isSelected && isCopying && <Spinner /> }
		</button>
	);
}

export default MediaItem;
