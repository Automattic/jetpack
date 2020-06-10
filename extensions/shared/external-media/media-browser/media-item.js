/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useRef, useEffect, useCallback } from '@wordpress/element';
import { Spinner } from '@wordpress/components';
import { ENTER, SPACE } from '@wordpress/keycodes';
import { __ } from '@wordpress/i18n';

function MediaItem( props ) {
	const onClick = useCallback( () => {
		if ( props.onClick ) {
			props.onClick( props.item );
		}
	}, [ props.onClick ] );

	const onKeyDown = useCallback(
		event => {
			// Catch space and enter key presses.
			if ( ENTER === event.keyCode || SPACE === event.keyCode ) {
				// Prevent spacebar from scrolling the page down.
				event.preventDefault();
				onClick( event );
			}

			if ( props.onKeyDown ) {
				props.onKeyDown( event );
			}
		},
		[ props.onKeyDown ]
	);

	const { item, focus, isSelected, isCopying = false } = props;
	const { thumbnails, caption, name, title, type, children = 0 } = item;
	const { medium = null, fmt_hd = null } = thumbnails;
	const alt = title || caption || name;
	const classes = classnames( {
		'jetpack-external-media-browser__media__item': true,
		'jetpack-external-media-browser__media__item__selected': isSelected,
		'jetpack-external-media-browser__media__folder': type === 'folder',
		'is-transient': isCopying,
	} );

	const itemEl = useRef( null );

	useEffect( () => {
		if ( focus ) {
			itemEl.current.focus();
		}
	}, [ focus ] );

	/* eslint-disable jsx-a11y/no-noninteractive-element-to-interactive-role */
	return (
		<li
			ref={ itemEl }
			className={ classes }
			onClick={ isCopying ? undefined : onClick }
			onKeyDown={ isCopying ? undefined : onKeyDown }
			role="checkbox"
			tabIndex="0"
			aria-checked={ !! isSelected }
			aria-disabled={ !! isCopying }
		>
			{ isSelected && isCopying && (
				<div className="jetpack-external-media-browser__media__copying_indicator">
					<Spinner />
					<div className="jetpack-external-media-browser__media__copying_indicator__label">
						{ __( 'Inserting Image…', 'jetpack' ) }
					</div>
				</div>
			) }

			<img src={ medium || fmt_hd } alt={ alt } />

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
