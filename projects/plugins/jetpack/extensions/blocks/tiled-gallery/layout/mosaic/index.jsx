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
	observedContainer = null; // flex container the observer is watching, besides the gallery

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
	 * Whether an element's inline size is decided by its own content rather than by its
	 * container. Such a box is useless as a layout anchor: measuring it feeds our own
	 * layout writes back into the width we lay out against. See JETPACK-1726.
	 *
	 * @param {HTMLElement} el   - The element to test.
	 * @param {Window}      view - The element's owning window.
	 * @return {boolean} True when the element's width follows its content.
	 */
	isContentSized( el, view ) {
		const style = view.getComputedStyle( el );
		if ( 'inline-flex' === style.display || 'inline-block' === style.display ) {
			return true;
		}
		if ( 'absolute' === style.position || 'fixed' === style.position ) {
			return true;
		}
		if ( style.float && 'none' !== style.float ) {
			return true;
		}
		if ( style.width && /^(max|min|fit)-content/.test( style.width ) ) {
			return true;
		}
		const parent = el.parentElement;
		if ( ! parent ) {
			return false;
		}
		const parentStyle = view.getComputedStyle( parent );
		if ( 'flex' !== parentStyle.display && 'inline-flex' !== parentStyle.display ) {
			return false;
		}
		if ( /^column/.test( parentStyle.flexDirection ) ) {
			// Stacked: width is the cross axis, so the item fills the container only
			// while it is stretched. `align-self` wins over the container's `align-items`.
			const align =
				! style.alignSelf || 'auto' === style.alignSelf ? parentStyle.alignItems : style.alignSelf;
			return !! align && 'stretch' !== align && 'normal' !== align;
		}
		// Side by side: width is the main axis, so an item that neither grows nor has a
		// definite basis is shrink-to-fit. `flex-basis` rather than `width`, which
		// computes to a used pixel value indistinguishable from `auto`.
		const basis = style.flexBasis;
		return '0' === style.flexGrow && ( ! basis || 'auto' === basis || 'content' === basis );
	}

	/**
	 * Nearest ancestor that lays the gallery out as a flex item, or null when the
	 * gallery isn't inside a flex container. The returned element is the flex
	 * container; its width is determined by the surrounding layout rather than by
	 * the gallery's own content, so it is a stable target to lay out against.
	 *
	 * Flex ancestors that are themselves content-sized are skipped: anchoring to one
	 * reintroduces the circular width, and the gallery grows without bound.
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
			// Never climb past the block-canvas root into editor chrome. In a
			// non-iframed editor (a classic theme with an apiVersion < 3 block keeps
			// the canvas non-iframed) the first flex ancestor outside the canvas is an
			// emotion-styled chrome div; laying the mosaic out against it divides its
			// width by its many children and collapses every item to ~105px. Only flex
			// containers inside the canvas (e.g. a Row/Stack block) are valid targets.
			// See JETPACK-1900.
			if ( el.matches( '.is-root-container, .editor-styles-wrapper' ) ) {
				return null;
			}
			const parent = el.parentElement;
			const display = view.getComputedStyle( parent ).display;
			if (
				( 'flex' === display || 'inline-flex' === display ) &&
				! this.isContentSized( parent, view )
			) {
				return parent;
			}
			el = parent;
		}
		return null;
	}

	/**
	 * Number of real flex items among a container's children. Excludes children that
	 * are not laid-out flex items — non-rendered elements (`<style>`, `<script>`,
	 * `<template>`, `<link>`) and elements taken out of flow (display:none or
	 * absolutely positioned, e.g. a popover slot) — which would otherwise inflate the
	 * equal-share divisor in getLayoutWidth. See JETPACK-1900.
	 *
	 * @param {HTMLElement} container - The flex container.
	 * @param {Window}      view      - The container's owning window.
	 * @return {number} Count of laid-out flex items.
	 */
	countFlexItems( container, view ) {
		const nonItemTags = [ 'STYLE', 'SCRIPT', 'TEMPLATE', 'LINK' ];
		return Array.from( container.children ).filter( child => {
			if ( nonItemTags.includes( child.tagName ) ) {
				return false;
			}
			const style = view.getComputedStyle( child );
			if ( 'none' === style.display ) {
				return false;
			}
			return 'absolute' !== style.position && 'fixed' !== style.position;
		} ).length;
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
		const view = container.ownerDocument?.defaultView || window;
		const style = view.getComputedStyle( container );
		// A column-direction container stacks its items, so each gets the full width.
		// Only a row makes them share it.
		if ( /^column/.test( style.flexDirection ) ) {
			return container.clientWidth;
		}
		// countFlexItems is a deliberate, pragmatic proxy for "number of flex items",
		// and the division below assumes those items are equal width — it does not
		// honor per-item flex-grow/flex-basis. That's enough for the common Row/Stack
		// of galleries; non-uniform rows are left as a follow-up.
		const count = this.countFlexItems( container, view );
		if ( count <= 1 ) {
			return container.clientWidth;
		}
		// Several flex items share the row. Give each an equal, deterministic share
		// of the container's available width (minus the flex gap) instead of
		// measuring the gallery's own width: that width is circularly defined by our
		// own layout and settles to a different value on each reload in Firefox.
		// Dividing the container width is content-independent, so the result is
		// stable across browsers/reloads. See JETPACK-1726.
		const gap = parseFloat( style.columnGap ) || 0;
		return ( container.clientWidth - gap * ( count - 1 ) ) / count;
	}

	/**
	 * Point the observer at the container the layout is currently anchored to.
	 *
	 * Re-resolved every pass rather than once at mount: the editor styles the canvas
	 * after the block mounts, so the first walk finds nothing, and the anchor moves
	 * again when a block above the gallery is re-aligned. See JETPACK-1726.
	 */
	syncContainerObservation() {
		if ( ! this.ro ) {
			return;
		}
		const container = this.getFlexContainer();
		if ( container === this.observedContainer ) {
			return;
		}
		if ( this.observedContainer ) {
			this.ro.unobserve( this.observedContainer );
		}
		this.observedContainer = container;
		if ( container ) {
			this.ro.observe( container );
		}
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
			// Before any early return below: the anchor must stay observed even on a
			// pass that changes nothing, or a later resize of it goes unnoticed.
			this.syncContainerObservation();
			// Lay out against a stable width rather than the (possibly content-sized)
			// observed width, so the result is deterministic across browsers/reloads.
			const width = this.getLayoutWidth();
			// A gallery that is not laid out yet, or that sits inside a hidden
			// container, measures 0px. Percentages derived from that are meaningless
			// — a single column row divides zero by zero and produces NaN — and the
			// widths this pass reports are persisted, so wait for a real measurement
			// rather than saving nonsense. See JETPACK-1990.
			if ( width <= 0 ) {
				return;
			}
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
			// necessarily change the gallery's own box, so observe it directly. Often
			// resolves nothing this early; every layout pass re-syncs it.
			this.syncContainerObservation();
		}
	}

	unobserveResize() {
		if ( this.ro ) {
			this.ro.disconnect();
			this.ro = null;
		}
		this.observedContainer = null;
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
