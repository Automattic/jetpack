/**
 * External dependencies
 */
import { chunk } from 'lodash';

/**
 * Internal dependencies
 */
import Row from './row';
import Column from './column';
import Gallery from './gallery';
import { MAX_COLUMNS } from '../constants';

export default function Masonry( { columns, renderedImages } ) {
	const columnCount = Math.min( MAX_COLUMNS, columns );

	const columnsWithImages = chunk( renderedImages, columnCount );

	return (
		<Gallery>
			<Row className={ `columns-${ columnCount }` }>
				{ columnsWithImages.map( ( images, columnIndex ) => (
					<Column key={ `column-${ columnIndex }` }>{ images }</Column>
				) ) }
			</Row>
		</Gallery>
	);
}
