import { Component, createRef } from '@wordpress/element';
import Column from '../column';
import Gallery from '../gallery';
import Row from '../row';
import { imagesToRatios, ratiosToColumns, ratiosToMosaicRows } from './ratios';

export default class Mosaic extends Component {
	gallery = createRef();
	pendingRaf = null;

	render() {
		const { align, columns, images, layoutStyle, renderedImages, columnWidths } = this.props;

		const ratios = imagesToRatios( images );
		const rows =
			'columns' === layoutStyle
				? ratiosToColumns( ratios, columns )
				: ratiosToMosaicRows( ratios, { isWide: [ 'full', 'wide' ].includes( align ) } );

		let cursor = 0;
		return (
			<Gallery galleryRef={ this.gallery }>
				{ rows.map( ( row, rowIndex ) => (
					<Row key={ rowIndex }>
						{ row.map( ( colSize, colIndex ) => {
							const columnImages = renderedImages.slice( cursor, cursor + colSize );
							cursor += colSize;
							return (
								<Column key={ colIndex } width={ columnWidths?.[ rowIndex ]?.[ colIndex ] }>
									{ columnImages }
								</Column>
							);
						} ) }
					</Row>
				) ) }
			</Gallery>
		);
	}
}
