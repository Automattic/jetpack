import { Component, createRef, Platform } from '@wordpress/element';
import ResizeObserver from 'resize-observer-polyfill';
import Column from '../column';
import Gallery from '../gallery';
import Row from '../row';
import { imagesToRatios, ratiosToColumns, ratiosToMosaicRows } from './ratios';
import { getGalleryRows, handleRowResize } from './resize';

// Smallest width change (in px) that triggers a re-layout. Sub-pixel changes are
// the signature of a ResizeObserver feedback loop, not a real resize, so ignoring
// them keeps the observer from spiralling. See JETPACK-1726.
const RESIZE_THRESHOLD = 1;

export default class Mosaic extends Component {
	gallery = createRef();
	pendingRaf = null;
	lastWidth = null; // width (px) of the most recent layout pass
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

	/**
	 * Nearest ancestor that lays the gallery out as a flex item, or null when the
	 * gallery isn't inside a flex container. The returned element is the flex
	 * container; its width is determined by the surrounding layout rather than by
	 * the gallery's own content, so it is a stable target to lay out against.
	 *
	 * @return {?HTMLElement} The flex container, or null.
	 */
	getFlexContainer() {
		const node = this.gallery.current;
		if ( ! node ) {
			return null;
		}
		const view = node.ownerDocument?.defaultView || window;
		// Start above the gallery node itself (which is its own flex row container).
		let el = node.parentElement;
		while ( el && el.parentElement ) {
			const parent = el.parentElement;
			const display = view.getComputedStyle( parent ).display;
			if ( 'flex' === display || 'inline-flex' === display ) {
				return parent;
			}
			el = parent;
		}
		return null;
	}

	/**
	 * Width (px) to lay the mosaic out against. Normally the gallery's own
	 * content-box width, but when the gallery is a content-sized flex item (e.g.
	 * selfStretch:"fit" inside a Row/Stack) that width is circularly defined by our
	 * own layout and settles to a non-deterministic, browser-dependent value across
	 * reloads. In that case anchor to the flex container's available width, which is
	 * sized independently of the gallery's content. See JETPACK-1726.
	 *
	 * @return {number} The layout width in px.
	 */
	getLayoutWidth() {
		// Re-resolve each pass rather than caching at mount: in the editor the flex
		// ancestors may not be laid out yet on the first frame, and a stale null
		// cache would strand the gallery at its own (circular) width — the very
		// non-determinism this avoids.
		const container = this.getFlexContainer();
		if ( ! container ) {
			return this.gallery.current ? this.gallery.current.clientWidth : 0;
		}
		// children.length is a deliberate, pragmatic proxy for "number of flex
		// items", and the division below assumes those items are equal width — it
		// does not honor per-item flex-grow/flex-basis. That's enough for the common
		// Row/Stack of galleries; non-uniform rows are left as a follow-up.
		const count = container.children.length;
		if ( count <= 1 ) {
			return container.clientWidth;
		}
		// Several flex items share the row. Give each an equal, deterministic share
		// of the container's available width (minus the flex gap) instead of
		// measuring the gallery's own width: that width is circularly defined by our
		// own layout and settles to a different value on each reload in Firefox.
		// Dividing the container width is content-independent, so the result is
		// stable across browsers/reloads. See JETPACK-1726.
		const view = container.ownerDocument?.defaultView || window;
		const gap = parseFloat( view.getComputedStyle( container ).columnGap ) || 0;
		return ( container.clientWidth - gap * ( count - 1 ) ) / count;
	}

	handleGalleryResize = () => {
		if ( this.pendingRaf ) {
			cancelAnimationFrame( this.pendingRaf );
			this.pendingRaf = null;
		}
		this.pendingRaf = requestAnimationFrame( () => {
			const galleryNode = this.gallery.current;
			if ( ! galleryNode ) {
				return;
			}
			// Lay out against a stable width rather than the (possibly content-sized)
			// observed width, so the result is deterministic across browsers/reloads.
			const width = this.getLayoutWidth();
			// Ignore sub-pixel width changes. When the block is a content-sized flex
			// item (inside a Row/Stack), our own layout writes can feed back into the
			// observed width; bailing here stops that feedback loop.
			if ( null !== this.lastWidth && Math.abs( width - this.lastWidth ) < RESIZE_THRESHOLD ) {
				return;
			}
			this.lastWidth = width;
			const colWidths = [];
			getGalleryRows( galleryNode ).forEach( row => {
				colWidths.push( handleRowResize( row, width ) );
			} );
			if ( 'undefined' !== typeof this.props.onResize ) {
				this.props.onResize( colWidths );
			}
		} );
	};

	triggerResize() {
		if ( this.gallery.current ) {
			// The images or layout changed, not necessarily the width, so force the
			// next pass to run regardless of the resize threshold.
			this.lastWidth = null;
			this.handleGalleryResize();
		}
	}

	observeResize() {
		this.triggerResize();
		this.ro = new ResizeObserver( this.handleGalleryResize );
		if ( this.gallery.current ) {
			this.ro.observe( this.gallery.current );
			// Also watch the flex container: when the gallery lays out against the
			// container's width, a container resize (e.g. window resize) won't
			// necessarily change the gallery's own box, so observe it directly.
			const container = this.getFlexContainer();
			if ( container ) {
				this.ro.observe( container );
			}
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
