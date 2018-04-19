/*global wp*/

/**
 * WordPress dependencies (npm)
 */
const { Component } = wp.element;

/**
 * External Dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import TiledGalleryItem from './tiled-gallery-item.jsx';

class TiledGalleryLayoutSquare extends Component {

	render() {
		const { images } = this.props;
		return (
			<ul className="jetpack-tiled-gallery tiled-gallery tiled-gallery-unresized">
				{ images.map( ( props ) =>
					<TiledGalleryItem key={ props.id } { ...props } />
				) }
			</ul>
		);
	}
}

export default TiledGalleryLayoutSquare;

