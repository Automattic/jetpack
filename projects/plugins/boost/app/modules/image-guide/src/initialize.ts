import { MeasurableImageStore } from './stores/MeasurableImageStore';
import Main from './ui/Main.svelte';
import type { ImageGuideConfig } from './types';
import type { MeasurableImage } from '@automattic/jetpack-image-guide';

/**
 * Returns the closest parent element that is able to contain the image guide component.
 *
 * This is necessary to ensure that the image guide component is positioned correctly
 * within the DOM tree, and to prevent it from  being obscured
 * by other elements with a higher z-index.
 *
 * @param node The node to start searching from
 * @return The closest parent element that is able to contain the image guide component
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
 * @param measuredImages
 */
export function attachGuides( measuredImages: MeasurableImage[] ) {
	const componentConfiguration = measuredImages.reduce( ( acc, image ) => {
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
	}, {} as Record< number, ImageGuideConfig > );

	// Take the component configuration and create the Svelte components.
	return Object.values( componentConfiguration )
		.map( ( config: ImageGuideConfig ) => {
			// eslint-disable-next-line no-new
			new Main( config );
			return config.props.stores;
		} )
		.flat();
}
