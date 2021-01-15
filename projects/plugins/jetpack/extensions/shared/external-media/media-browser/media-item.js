/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useRef, useEffect } from '@wordpress/element';
import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

function MediaItem( props ) {
	const onClick = event => {
		const { item, index } = props;

		if ( props.onClick ) {
			props.onClick( event, { item, index } );
		}
	};

	// Catch space and enter key presses.
	const onKeyDown = event => {
		const { item, index } = props;

		if ( props.onKeyDown ) {
			props.onKeyDown( event, { item, index } );
		}
	};

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
		</li>
	);
}

export default MediaItem;
