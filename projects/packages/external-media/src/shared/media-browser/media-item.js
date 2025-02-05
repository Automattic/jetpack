import apiFetch from '@wordpress/api-fetch';
import { Spinner } from '@wordpress/components';
import { useRef, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import React from 'react';

/**
 * MediaItem component
 *
 * @param {object} props - The component props
 * @return {React.ReactElement} - JSX element
 */
function MediaItem( props ) {
	const onClick = event => {
		const { item, index, imageOnly } = props;

		// Skip non-image items if imageOnly flag is set.
		if ( item.type !== 'image' && imageOnly ) {
			return;
		}

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

	const getProxyImageUrl = async url => {
		try {
			const response = await apiFetch( {
				path: `/wpcom/v2/external-media/proxy/google_photos`,
				method: 'POST',
				data: { url },
				parse: false, // Disable automatic parsing
				responseType: 'blob',
			} );
			let blob;

			if ( response instanceof Blob ) {
				blob = response;
			} else {
				blob = await response.blob();
			}

			const imageObjectUrl = URL.createObjectURL( blob );

			setImageUrl( imageObjectUrl );
		} catch ( error ) {
			// eslint-disable-next-line no-console
			console.error( 'Error fetching proxy image:', error );
		}
	};

	const { item, focus, isSelected, isCopying = false, shouldProxyImg } = props;
	const { thumbnails, caption, name, title, type, children = 0 } = item;
	const { medium = null, fmt_hd = null, thumbnail = null } = thumbnails;
	const alt = title || caption || name;

	const [ imageUrl, setImageUrl ] = useState( null );

	useEffect( () => {
		const _imageUrl = medium || fmt_hd || thumbnail;

		if ( shouldProxyImg && _imageUrl ) {
			! imageUrl && getProxyImageUrl( _imageUrl );
		} else {
			setImageUrl( _imageUrl );
		}
	}, [ shouldProxyImg, imageUrl, medium, fmt_hd, thumbnail ] );

	const classes = clsx( {
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
						{ __( 'Inserting Image…', 'jetpack-external-media' ) }
					</div>
				</div>
			) }
			{ imageUrl && <img src={ imageUrl } alt={ alt } /> }
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
