import { MeasurableImageStore } from './stores/MeasurableImageStore';
import Main from './ui/Main.svelte';
import type { MeasurableImage } from './MeasurableImage';
import type { ImageComponentConfig } from './types';

/**
 * This function looks for the closest parent that is
 * able to contain the image guide component.
 *
 * @param  node The node to start looking from
 */
function closestStableParent( node: HTMLElement ): HTMLElement | null {
	if ( ! node.parentNode ) {
		return null;
	}

	if ( ! ( node.parentNode instanceof HTMLElement ) ) {
		return null;
	}

	// Stop searching at body.
	if ( node.parentNode.tagName === 'BODY' ) {
		return node.parentNode;
	}
	if ( node.parentNode.classList.contains( 'jetpack-boost-guide' ) ) {
		return node.parentNode;
	}

	const position = getComputedStyle( node.parentNode ).position;
	if ( position === 'static' || position === 'relative' ) {
		return node.parentNode;
	}

	return closestStableParent( node.parentNode );
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
		!( image.node instanceof HTMLImageElement ) &&
		[ 'static', 'relative' ].includes( getComputedStyle( node ).position )
	) {
		return node;
	}

	if ( ! node.parentNode || ! node.parentElement ) {
		return;
	}

	const parent = closestStableParent( node );

	if ( parent?.classList.contains( 'jetpack-boost-guide' ) ) {
		return parent;
	}

	if ( parent ) {
		const parentStyle = getComputedStyle( parent );

		// If this is a relative parent, see if any boost guide-elements are in here already
		if ( parentStyle.position === 'relative' ) {
			const existing = Array.from( parent.children ).find( child =>
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
			wrapper.classList.add( 'relative' );
			Array.from( parent.children )
				.reverse()
				.forEach( child => wrapper.appendChild( child ) );
		}

		parent.prepend( wrapper );
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
 * @param  measuredImages
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
	}, {} as Record< number, ImageComponentConfig > );

	// Take the component configuration and create the Svelte components.
	return Object.values( componentConfiguration )
		.map( config => {
			// eslint-disable-next-line no-new
			new Main( config );
			return config.props.stores;
		} )
		.flat();
}
