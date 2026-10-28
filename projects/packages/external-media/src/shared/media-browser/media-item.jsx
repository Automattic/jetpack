import apiFetch from '@wordpress/api-fetch';
import { Composite } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Checkbox, Stack, Text } from '@wordpress/ui';
import clsx from 'clsx';

/**
 * MediaItem component
 *
 * @param {object}   props                - The component props
 * @param {object}   props.item           - The media item
 * @param {boolean}  props.imageOnly      - Whether to skip non-media items
 * @param {boolean}  props.isSelected     - Whether the media item is selected
 * @param {boolean}  props.isCopying      - Whether the media browser is copying the media
 * @param {boolean}  props.shouldProxyImg - Whether to use the proxy for the media URL
 * @param {Function} props.onClick        - To handle the selection
 * @return {import('react').ReactElement} - JSX element
 */
function MediaItem( { item, imageOnly, isSelected, isCopying = false, shouldProxyImg, onClick } ) {
	const { thumbnails, caption, name, title, type, children = 0 } = item;
	const { medium = null, fmt_hd = null, thumbnail = null } = thumbnails;
	const alt = title || caption || name || '';
	const [ imageUrl, setImageUrl ] = useState( null );
	const classes = clsx( {
		'jetpack-external-media-browser__media__item': true,
		'jetpack-external-media-browser__media__item__selected': isSelected,
		'jetpack-external-media-browser__media__folder': type === 'folder',
		'is-transient': isCopying,
	} );

	const selectionLabel = isSelected
		? sprintf(
				/* translators: %s: item title. */
				__( 'Deselect item: %s', 'jetpack-external-media' ),
				alt
			)
		: sprintf(
				/* translators: %s: item title. */
				__( 'Select item: %s', 'jetpack-external-media' ),
				alt
			);

	const handleClick = event => {
		if ( isCopying ) {
			return;
		}

		// Skip non-image items if imageOnly flag is set.
		if ( item.type !== 'image' && imageOnly ) {
			return;
		}

		onClick?.( event, { item } );
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

	useEffect( () => {
		const _imageUrl = medium || fmt_hd || thumbnail;

		if ( shouldProxyImg && _imageUrl ) {
			! imageUrl && getProxyImageUrl( _imageUrl );
		} else {
			setImageUrl( _imageUrl );
		}
	}, [ shouldProxyImg, imageUrl, medium, fmt_hd, thumbnail ] );

	return (
		<Composite.Item
			className={ classes }
			onClick={ isCopying ? undefined : handleClick }
			aria-checked={ !! isSelected }
			aria-disabled={ !! isCopying }
			aria-label={ selectionLabel }
			render={
				type === 'folder' ? (
					<Stack
						wrap="wrap"
						align="center"
						justify="space-between"
						render={ <li role="option" /> }
					/>
				) : (
					<li role="option" />
				)
			}
		>
			{ imageUrl && <img src={ imageUrl } alt={ alt } /> }
			{ type === 'folder' && (
				<Stack
					direction="row"
					justify="space-between"
					align="start"
					className="jetpack-external-media-browser__media__info"
				>
					<Text variant="body-sm" className="jetpack-external-media-browser__media__name">
						{ name }
					</Text>
					<Text variant="body-sm" className="jetpack-external-media-browser__media__count">
						{ children }
					</Text>
				</Stack>
			) }
			<Checkbox
				className="jetpack-external-media-browser__media__checkbox"
				aria-label={ selectionLabel }
				aria-disabled={ !! isCopying }
				checked={ !! isSelected }
				onCheckedChange={ () => handleClick() }
			/>
		</Composite.Item>
	);
}

export default MediaItem;
