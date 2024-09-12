import { isBlobURL } from '@wordpress/blob';
import clsx from 'clsx';

export default function GalleryImageSave( props ) {
	const { alt, imageFilter, height, id, link, linkTo, origUrl, url, width } = props;

	if ( isBlobURL( origUrl ) ) {
		return null;
	}

	let href;

	switch ( linkTo ) {
		case 'media':
			href = origUrl;
			break;
		case 'attachment':
			href = link;
			break;
	}

	const img = (
		<img
			alt={ alt }
			data-height={ height }
			data-id={ id }
			data-link={ link }
			data-url={ origUrl }
			data-width={ width }
			src={ url }
			data-amp-layout={ 'responsive' }
		/>
	);

	return (
		<figure
			className={ clsx( 'tiled-gallery__item', {
				[ `filter__${ imageFilter }` ]: !! imageFilter,
			} ) }
		>
			{ href ? <a href={ href }>{ img }</a> : img }
		</figure>
	);
}
