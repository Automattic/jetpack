/*global wp*/

/**
 * WordPress dependencies (npm)
 */
const { withSelect } = wp.data;

/**
 * External Dependencies
 */
import React from 'react';
import get from 'lodash/get';

function TiledGalleryImage( props ) {
	const { url, alt, id, link } = props;
	const { width, height } = get( props.image, [ 'media_details' ], { width: -1, height: -1 } );

	return (
    <figure>
			<span>{ width } x { height }</span>
			<meta itemprop="width" content={ width } />
			<meta itemprop="height" content={ height } />
			<img
				src={ url } alt={ alt } data-id={ id } data-link={ link }
				width={ width }
				height={ height }
				data-original-width={ width }
				data-original-height={ height } />
    </figure>
	);
}

function TiledGalleryItem( props ) {
	const href = props.link;

	const classes = [ 'tiled-gallery-item steve' ];
	classes.push( 'tiled-gallery-item-small' );

	const img = TiledGalleryImage( props );

	return (
		<li key={ props.id || props.url } className={ classes.join( ' ' ) } itemprop="associatedMedia" itemscope="" itemtype="http://schema.org/ImageObject">
			{ href ? <a href={ href }>{ img }</a> : img }
		</li>
	);
}

export default withSelect( ( select, ownProps ) => {
	const { getMedia } = select( 'core' );
	const { id } = ownProps;

	return {
		image: id ? getMedia( id ) : null,
	};
} )( TiledGalleryItem );

