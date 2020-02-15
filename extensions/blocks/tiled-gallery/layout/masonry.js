/**
 * Internal dependencies
 */
import Row from './row';
import Column from './column';
import Gallery from './gallery';
import { MAX_COLUMNS } from '../constants';

export default function Masonry( { columns, renderedImages } ) {
	const columnCount = Math.min( MAX_COLUMNS, columns );

	// Loop images so that every nth is placed on top of each column
	// Alternatively we could 'chunk' the array but this way sorting will flow
	// more naturally and be more predictable.
	const columnsForImages = [];
	for ( let columnIndex = 0; columnIndex < columnCount; columnIndex++ ) {
		columnsForImages.push(
			<Column key={ `column-${ columnIndex }` }>
				{ renderedImages.filter( ( image, imageIndex ) => {
					// Every nth image based on number of columns
					return imageIndex % columnCount === columnIndex;
				} ) }
			</Column>
		);
	}

	return (
		<Gallery>
			<Row className={ `columns-${ columnCount }` }>{ columnsForImages }</Row>
		</Gallery>
	);
}
