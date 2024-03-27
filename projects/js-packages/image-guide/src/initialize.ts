import ImageGuideAnalytics from './analytics.js';
import { getMeasurableImages } from './find-image-elements.js';
import { guideState } from './stores/GuideState.js';
import { MeasurableImageStore } from './stores/MeasurableImageStore.js';
import Main from './ui/Main.svelte';
import type { FetchFn, MeasurableImage } from './MeasurableImage.js';
import type { ImageGuideConfig } from './types.js';

const measurableImageStores: MeasurableImageStore[] = [];
let fetchFunction: FetchFn | undefined;

/**
 * Set up a listener to initialize stuff on window load.
 *
 * @param {Function} fetchFn - An optional custom function to use when fetching the URL weights.
 */
export function setupLoadListener( fetchFn?: FetchFn ) {
	if ( window.frameElement ) {
		return;
	}

	fetchFunction = fetchFn;
	window.addEventListener( 'load', onWindowLoad );
}

/**
 * Handler for window load event.
 */
function onWindowLoad() {
	window.addEventListener( 'resize', debounceDimensionUpdates() );

	// Track the initial state of the Image Guide onload.
	ImageGuideAnalytics.trackInitialState();

	// Watch for the guide being turned on/off
	guideState.subscribe( async $state => {
		if ( $state === 'paused' ) {
			return;
		}
		const measurableImages = await getMeasurableImages(
			Array.from(
				document.querySelectorAll(
					'body *:not(.jetpack-boost-guide > *):not(.jetpack-boost-guide)'
				)
			),
			fetchFunction
		);

		// wait for isImageTiny() to return true/false for each image.
		const tinyImages = await Promise.all( measurableImages.map( image => image.isImageTiny() ) );
		measurableImageStores.push(
			...attachGuides( measurableImages.filter( ( _, index ) => ! tinyImages[ index ] ) )
		);

		ImageGuideAnalytics.trackPage( measurableImageStores );
	} );
}

/**
 * Guides need to recalculate dimensions and possibly weights.
 * This is done when the window is resized,
 * but because that event is fired multiple times,
 * it's better to debounce it.
 *
 * @return {Function} A debounced function that recalculates dimensions and weights.
 */
function debounceDimensionUpdates() {
	let debounce: number;
	return () => {
		if ( debounce ) {
			clearTimeout( debounce );
		}
		debounce = setTimeout( () => {
			measurableImageStores.forEach( store => {
				store.updateDimensions();
			} );
		}, 500 );
	};
}

/**
 * Returns the closest parent element that is able to contain the image guide component.
 *
 * This is necessary to ensure that the image guide component is positioned correctly
 * within the DOM tree, and to prevent it from  being obscured
 * by other elements with a higher z-index.
 *
 * @param {HTMLElement} node - The node to start searching from
 * @return {HTMLElement} The closest parent element that is able to contain the image guide component
 */
function getClosestContainingAncestor( node: HTMLElement ): HTMLElement | null {
	let current: HTMLElement | null = node.parentElement;

	// Keep track of target element
	let target: HTMLElement;
	while ( current && current instanceof HTMLElement ) {
		// Don't go past the body element
		if ( current === document.body ) {
			break;
		}

		const style = getComputedStyle( current );

		// Guide can't be correctly positioned inside inline elements
		// because they don't have dimensions.
		const canContainBlockElements = style.display !== 'inline';
		const isStatic = style.position === 'static';
		const isRelative = style.position === 'relative';
		const hasZIndex = style.zIndex !== 'auto';
		const isRelativeWithZIndex = isRelative && hasZIndex;

		if (
			canContainBlockElements &&
			( ( ! target && ( isStatic || isRelative ) ) || isRelativeWithZIndex )
		) {
			target = current;
		}

		current = current.parentElement;
	}

	return target;
}

/**
 * Possible paths forward:
 *
 * If an image has absolute position, place the previews next to the image
 * If the image is a static image, wrap it in a div and place the previews next to the image
 * If the image is a background image, inside the element that has a background image
 *
 */
let wrapperID = 0;

/**
 * Find the container for the image guide component.
 *
 * @param {MeasurableImage} image - The image to find the container for.
 * @return {HTMLElement | undefined} The container for the image guide component.
 */
function findContainer( image: MeasurableImage ): HTMLElement | undefined {
	const node = image.node;

	/**
	 * If the image is a background image and if it's not pulled out of the flow,
	 * the same node can be used to insert the guide component,
	 */
	if (
		! ( image.node instanceof HTMLImageElement ) &&
		[ 'static', 'relative' ].includes( getComputedStyle( node ).position )
	) {
		/*
		 Since we are only taking static and relative, let's convert it to relative
		 and mark it as a wrapper so that we can position the guide component properly.
		*/
		if ( ! node.classList.contains( 'jetpack-boost-guide' ) ) {
			node.classList.add( 'jetpack-boost-guide', 'relative' );
			node.dataset.jetpackBoostGuideId = ( ++wrapperID ).toString();
		}
		return node;
	}

	if ( ! node.parentNode || ! node.parentElement ) {
		return;
	}

	const ancestor = getClosestContainingAncestor( node );

	if ( ancestor?.classList.contains( 'jetpack-boost-guide' ) ) {
		return ancestor;
	}

	if ( ancestor ) {
		const parentStyle = getComputedStyle( ancestor );

		// If this is a relative parent, see if any boost guide-elements are in here already
		if ( parentStyle.position === 'relative' ) {
			const existing = Array.from( ancestor.children ).find( child =>
				child.classList.contains( 'jetpack-boost-guide' )
			);
			if ( existing && existing instanceof HTMLElement ) {
				return existing;
			}
		}

		const wrapper = document.createElement( 'div' );
		wrapper.classList.add( 'jetpack-boost-guide' );
		wrapper.dataset.jetpackBoostGuideId = ( ++wrapperID ).toString();
		if ( parentStyle.position === 'static' ) {
			ancestor.style.position = 'relative';
		}

		if ( image.node instanceof HTMLImageElement ) {
			// The guide element should be on the same y-axis level as the image.
			wrapper.style.top = `${ image.node.offsetTop }px`;
		}

		ancestor.prepend( wrapper );
		return wrapper;
	}

	return node.parentElement;
}

/**
 * This gets a little tricky because of the various layout positions
 * the images can be in.
 *
 * For example, images can be positioned with static, absolute, fixed, etc.
 * But on top of that, they can be a part of a parent that has that positioning.
 * And to make things even more complex, they can change dynamically, for example in a slider.
 *
 * This function attempts to attach the Svelte Components to the DOM in a non-destructive way.
 *
 * @param {MeasurableImage[]} measuredImages - The images to attach the guides to.
 * @return {MeasurableImageStore[]} The stores for the attached images.
 */
export function attachGuides( measuredImages: MeasurableImage[] ) {
	const componentConfiguration = measuredImages.reduce(
		( acc, image ) => {
			if ( ! image.node.parentNode ) {
				// eslint-disable-next-line no-console
				console.error( `Image has no parent`, image.node );
				return acc;
			}

			const container = findContainer( image );

			if ( ! container ) {
				// eslint-disable-next-line no-console
				console.error( `Could not find a parent for image`, image );
				return acc;
			}

			// Don't create new entry for Svelte component configuration.
			// Use the index in the array as a unique identifier.
			const id = parseInt( container.dataset.jetpackBoostGuideId || '' );
			const stores = acc[ id ]?.props.stores || [];
			const store = new MeasurableImageStore( image );
			stores.push( store );

			// If there's only one image, assume a new Svelte component needs to be created.
			if ( stores.length === 1 ) {
				acc[ id ] = {
					target: container,
					// This triggers the nice fade-in animation as soon as the component is attached.
					intro: true,
					props: {
						stores,
					},
				};
			}

			return acc;
		},
		{} as Record< number, ImageGuideConfig >
	);

	// Take the component configuration and create the Svelte components.
	return Object.values( componentConfiguration )
		.map( ( config: ImageGuideConfig ) => {
			// eslint-disable-next-line no-new
			new Main( config );
			return config.props.stores;
		} )
		.flat();
}
