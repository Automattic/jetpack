/**
 * External Dependencies
 */
import React from 'react';

function TiledGalleryImage( props ) {
	const { url, alt, id, link } = props;
	return (
    <figure>
			<meta itemprop="width" content={ 227 } />
			<meta itemprop="height" content={ 170 } />
			<img
				src={ url } alt={ alt } data-id={ id } data-link={ link }
				width="227"
				height="170"
				data-original-width="227"
				data-original-height="170" />
    </figure>
	);
}

function TiledGalleryItem( image ) {
	const href = image.link;
	const img = TiledGalleryImage( image );
	const classes = [ 'tiled-gallery-item' ];
	classes.push( 'tiled-gallery-item-small' );

	return (
    <div key={ image.id } className={ classes.join( ' ' ) } itemprop="associatedMedia" itemscope="" itemtype="http://schema.org/ImageObject">
			{ href ? <a href={ href }>{ img }</a> : img }
    </div>
	);
}

export default TiledGalleryItem;

