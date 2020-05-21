/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { Spinner } from '@wordpress/components';
import { ENTER, SPACE } from '@wordpress/keycodes';

function MediaItem( props ) {
	const onClick = useCallback( () => {
		if ( props.onClick ) {
			props.onClick( props.item );
		}
	}, [ props.onClick ] );

	// Catch space and enter key presses.
	const onKeyDown = event => {
		if ( ENTER === event.keyCode || SPACE === event.keyCode ) {
			// Prevent spacebar from scrolling the page down.
			event.preventDefault();
			onClick( event );
		}
	};

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

	/* eslint-disable jsx-a11y/no-noninteractive-element-to-interactive-role */
	return (
		<li
			className={ classes }
			onClick={ onClick }
			onKeyDown={ onKeyDown }
			role="checkbox"
			tabIndex="0"
			aria-checked={ isSelected ? 'true' : 'false' }
		>
			<img src={ medium || fmt_hd } alt={ alt } title={ alt } />

			{ type === 'folder' && (
				<div className="jetpack-external-media-browser__media__info">
					<div className="jetpack-external-media-browser__media__name">{ name }</div>
					<div className="jetpack-external-media-browser__media__count">{ children }</div>
				</div>
			) }

			{ isSelected && isCopying && <Spinner /> }
		</li>
	);
}

export default MediaItem;
