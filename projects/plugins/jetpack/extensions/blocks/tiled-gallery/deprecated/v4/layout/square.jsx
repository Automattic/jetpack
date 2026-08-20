import { chunk } from 'lodash';
import { MAX_COLUMNS } from '../constants';
import Column from './column';
import Gallery from './gallery';
import Row from './row';

export default function Square( { columns, renderedImages } ) {
	const columnCount = Math.min( MAX_COLUMNS, columns );

	const remainder = renderedImages.length % columnCount;

	return (
		<Gallery>
			{ [
				...( remainder ? [ renderedImages.slice( 0, remainder ) ] : [] ),
				...chunk( renderedImages.slice( remainder ), columnCount ),
			].map( ( imagesInRow, rowIndex ) => (
				<Row key={ rowIndex } className={ `columns-${ imagesInRow.length }` }>
					{ imagesInRow.map( ( image, colIndex ) => (
						<Column key={ colIndex }>{ image }</Column>
					) ) }
				</Row>
			) ) }
		</Gallery>
	);
}
