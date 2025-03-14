import { Component, createRef, Platform } from '@wordpress/element';
import ResizeObserver from 'resize-observer-polyfill';
import Column from '../column';
import Gallery from '../gallery';
import Row from '../row';
import { imagesToRatios, ratiosToColumns, ratiosToMosaicRows } from './ratios';
import { getGalleryRows, handleRowResize } from './resize';

export default class Mosaic extends Component {
	gallery = createRef();
	pendingRaf = null;
	ro = null; // resizeObserver instance

	componentDidMount() {
		this.observeResize();
	}

	componentWillUnmount() {
		this.unobserveResize();
	}

	componentDidUpdate( prevProps ) {
		if ( prevProps.images !== this.props.images || prevProps.align !== this.props.align ) {
			this.triggerResize();
		} else if ( 'columns' === this.props.layoutStyle && prevProps.columns !== this.props.columns ) {
			this.triggerResize();
		}
	}

	handleGalleryResize = entries => {
		if ( this.pendingRaf ) {
			cancelAnimationFrame( this.pendingRaf );
			this.pendingRaf = null;
		}
		this.pendingRaf = requestAnimationFrame( () => {
			for ( const { contentRect, target } of entries ) {
				const { width } = contentRect;
				const colWidths = [];
				getGalleryRows( target ).forEach( row => {
					colWidths.push( handleRowResize( row, width ) );
				} );
				if ( 'undefined' !== typeof this.props.onResize ) {
					this.props.onResize( colWidths );
				}
			}
		} );
	};

	triggerResize() {
		if ( this.gallery.current ) {
			this.handleGalleryResize( [
				{
					target: this.gallery.current,
					contentRect: { width: this.gallery.current.clientWidth },
				},
			] );
		}
	}

	observeResize() {
		this.triggerResize();
		this.ro = new ResizeObserver( this.handleGalleryResize );
		if ( this.gallery.current ) {
			this.ro.observe( this.gallery.current );
		}
	}

	unobserveResize() {
		if ( this.ro ) {
			this.ro.disconnect();
			this.ro = null;
		}
		if ( this.pendingRaf ) {
			cancelAnimationFrame( this.pendingRaf );
			this.pendingRaf = null;
		}
	}

	getColumnWidths( rows, images, width ) {
		let cursor = 0;
		const content = rows.map( row => {
			return row.map( colSize => {
				const columnImages = images.slice( cursor, cursor + colSize );
				cursor += colSize;
				return columnImages;
			} );
		} );

		const result = content.map( row => handleRowResize( row, width ) );
		return result;
	}

	render() {
		const { align, columns, images, layoutStyle, renderedImages } = this.props;

		const ratios = imagesToRatios( images );
		const rows =
			'columns' === layoutStyle
				? ratiosToColumns( ratios, columns )
				: ratiosToMosaicRows( ratios, { isWide: [ 'full', 'wide' ].includes( align ) } );

		const columnWidths = Platform.select( {
			web: () => this.props.columnWidths,
			native: () => this.getColumnWidths( rows, renderedImages, 1000 ),
		} )();

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
