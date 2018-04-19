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

	computeItems() {
		const { columns, images } = this.props;

		const content_width = 400; // todo: get content width
		const images_per_row = ( columns > 1 ? columns : 1 );
		const margin = 2;

		const margin_space = ( images_per_row * margin ) * 2;
		const size = Math.floor( ( content_width - margin_space ) / images_per_row );
		let remainder_size = size;
		let img_size = remainder_size;
		const remainder = images.length % images_per_row;
		let remainder_space = 0;
		if ( remainder > 0 ) {
			remainder_space = ( remainder * margin ) * 2;
			remainder_size = Math.floor( ( content_width - remainder_space ) / remainder );
		}

		let c = 1;
		let items_in_row = 0;
		const rows = [];
		let row = {
			images: [],
		};
		for ( const image of images ) {
			if ( remainder > 0 && c <= remainder ) {
				img_size = remainder_size;
			} else {
				img_size = size;
			}

			image.cropWidth = image.cropHeight = img_size;

			const item = (
				<TiledGalleryItem
					key={ image.id }
					id={ image.id }
					url={ image.url }
					alt={ image.id }
					link={ image.link }
					width={ image.width }
					height={ image.height }
					cropWidth={ image.cropWidth }
					cropHeight={ image.cropHeight }
					setAttributes={ image.setAttributes }
				/>
			);//new Jetpack_Tiled_Gallery_Square_Item( $image, $this->needs_attachment_link, $this->grayscale );

			row.images.push( item );
			c++;
			items_in_row++;

			if ( images_per_row === items_in_row || ( remainder + 1 ) === c ) {
				rows.push( row );
				items_in_row = 0;

				row.height = img_size + margin * 2;
				row.width = content_width;
				row.group_size = img_size + 2 * margin;

				row = {
					images: [],
				};
			}
		}

		if ( row.images.length > 0 ) {
			row.height = img_size + margin * 2;
			row.width = content_width;
			row.group_size = img_size + 2 * margin;

			rows.push( row );
		}

		return rows;
	}

	render() {
		const rows = this.computeItems();

		return (
			<div className="tiled-gallery tiled-gallery-unresized">
				{ rows.map( ( row, index ) =>
					<div key={ index } className="tiled-gallery-row">
						{ row.images }
					</div>
				) }
			</div>
		);
	}
}

export default TiledGalleryLayoutSquare;

