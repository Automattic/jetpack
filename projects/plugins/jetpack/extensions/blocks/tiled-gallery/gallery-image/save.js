import { isSimpleSite } from '@automattic/jetpack-script-data';
import { isBlobURL } from '@wordpress/blob';
import clsx from 'clsx';

export default function GalleryImageSave( props ) {
	const { alt, imageFilter, height, id, link, linkTo, customLink, origUrl, url, width } = props;

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
		case 'custom':
			href = customLink || '';
			break;
		default:
			href = '';
	}

	const ampLayout = ! isSimpleSite() ? { 'data-amp-layout': 'responsive' } : {};

	const img = (
		<img
			alt={ alt }
			data-height={ height } // These data- attributes are whitelisted for use on Simple sites. See the $allowedposttags['img'] options in wp-content/mu-plugins/wpcom-kses-config.php.
			data-id={ id }
			data-link={ link }
			data-url={ origUrl }
			data-width={ width }
			src={ url }
			{ ...ampLayout } // This is stripped on Simple sites causing block validation issues (and is also not needed there) - see _wpcom_remove_data_wildcard_attribute in wp-content/mu-plugins/wpcom-kses-config.php on WPCom.
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
