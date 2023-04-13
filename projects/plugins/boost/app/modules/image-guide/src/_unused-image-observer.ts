/**
 *
 *
 * ! MutationObserver is currently not used.
 * ! This needs significant improvement before we can use it.
 *
 *
 */
type ImageCallback = ( images: HTMLElement[] ) => void;

const onChange =
	( callback: ImageCallback ): MutationCallback =>
	mutationList => {
		const mutations = mutationList
			.filter( mutation => {
				// Ignore mutations that added `jetpack-boost-guide-image` class
				if ( mutation.type === 'attributes' && mutation.attributeName === 'class' ) {
					const target = mutation.target as HTMLImageElement;
					if ( target.classList.contains( 'jetpack-boost-guide-image' ) ) {
						return false;
					}
				}

				// New image elements are added to the DOM
				if ( mutation.type === 'childList' && mutation.addedNodes.length > 0 ) {
					mutation.addedNodes.forEach( node => {
						if ( node instanceof HTMLImageElement ) {
							return true;
						}

						/**
						 * TODO:
						 * MutationObserver only detects the parent node that was added.
						 * Any child nodes that were added are not detected.
						 */

						// Walk the DOM tree to find any image elements
						const walker = document.createTreeWalker( node, NodeFilter.SHOW_ELEMENT );
						while ( walker.nextNode() ) {
							if ( walker.currentNode instanceof HTMLImageElement ) {
								return true;
							}
						}
					} );
				}

				if ( mutation.type === 'attributes' ) {
					// Mutations that change the src attribute
					if ( mutation.target instanceof HTMLImageElement && mutation.attributeName === 'src' ) {
						return true;
					}

					// Mutations that add a background image
					if ( mutation.attributeName === 'style' ) {
						return getComputedStyle( mutation.target as Element ).backgroundImage !== 'none';
					}
				}

				// Ignore mutations that don't add images
				return false;
			} )
			.map( mutation => {
				if ( mutation.type === 'attributes' ) {
					return mutation.target as HTMLElement;
				}
				if ( mutation.type === 'childList' ) {
					const images = Array.from( mutation.addedNodes ).filter(
						node => node instanceof HTMLImageElement
					);
					if ( images.length > 0 ) {
						return images as HTMLElement[];
					}
				}
				const walker = document.createTreeWalker( mutation.target, NodeFilter.SHOW_ELEMENT );
				while ( walker.nextNode() ) {
					if ( walker.currentNode instanceof HTMLImageElement ) {
						return walker.currentNode;
					}
				}

				return [];
			} )
			.flat();

		if ( mutations.length > 0 ) {
			callback( mutations );
		}
	};

export async function createImageObserver( callback: ImageCallback ) {
	const target = document.body;
	const config = { childList: true, characterData: false, subtree: true, attributes: true };

	const observer = new MutationObserver( onChange( callback ) );

	observer.observe( target, config );

	return observer;
}
