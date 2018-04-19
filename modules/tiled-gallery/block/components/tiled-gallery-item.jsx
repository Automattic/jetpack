/*global wp*/

/**
 * WordPress dependencies (npm)
 */
const { withSelect } = wp.data;
const { Component } = wp.element;

/**
 * External Dependencies
 */
import React from 'react';
import get from 'lodash/get';

class TiledGalleryImage extends Component {

	componentWillReceiveProps( { image, width, height } ) {
		// very carefully set width & height attributes once only!
		if ( image && ! width && ! height ) {
			const mediaInfo = get( image, [ 'media_details' ], { width: null, height: null } );
			this.props.setAttributes( {
				width: mediaInfo.width,
				height: mediaInfo.height
			} );
		}
	}

	render() {
		const { url, alt, id, link, width, height } = this.props;

		return (
			<figure>
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
}

function TiledGalleryItem( props ) {
	const href = props.link;

	const classes = [ 'tiled-gallery-item steve' ];
	classes.push( 'tiled-gallery-item-small' );

	const img = ( <TiledGalleryImage { ...props } /> );

	return (
		<li
			key={ props.id || props.url }
			className={ classes.join( ' ' ) }
			itemprop="associatedMedia"
			itemscope=""
			itemtype="http://schema.org/ImageObject">
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

