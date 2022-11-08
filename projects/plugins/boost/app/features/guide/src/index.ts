import { load, Image } from './Images';
import { measure, MeasuredImage } from './Measurements';

import Main from './ui/Main.svelte';

function closestStableParent(node: Element, distance = 0): Element | null {
	if (!node.parentNode) {
		return null;
	}

	if (!(node.parentNode instanceof Element)) {
		return null;
	}

	// Stop searching at body.
	if (node.parentNode.tagName === 'BODY') {
		node.parentNode;
	}
	if (node.parentNode.classList.contains('jetpack-boost-guide')) {
		return node.parentNode;
	}

	const position = getComputedStyle(node.parentNode).position;
	if (position === 'static' || position === 'relative') {
		return node.parentNode;
	}

	return closestStableParent(node.parentNode, ++distance);
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
function findContainer(image: Image): Element | undefined {
	const node = image.node;

	if (
		image.type === 'background' &&
		!['absolute', 'fixed'].includes(getComputedStyle(node).position)
	) {
		return node;
	}

	if (!node.parentNode || !node.parentElement) {
		return;
	}

	const parent = closestStableParent(node);

	if (parent?.classList.contains('jetpack-boost-guide')) {
		return parent;
	}

	if (parent) {
		const parentStyle = getComputedStyle(parent);

		// If this is a relative parent, see if any boost guide-elements are in here already
		if (parentStyle.position === 'relative') {
			const existing = Array.from(parent.children).find(child =>
				child.classList.contains('jetpack-boost-guide')
			);
			if (existing) {
				return existing;
			}
		}

		const wrapper = document.createElement('div');
		wrapper.classList.add('jetpack-boost-guide');
		wrapper.dataset.jetpackBoostGuideId = (++wrapperID).toString();
		if (parentStyle.position === 'static') {
			wrapper.classList.add('relative');
			Array.from(parent.children)
				.reverse()
				.forEach(child => wrapper.appendChild(child));
		}

		parent.prepend(wrapper);
		return wrapper;
	}

	// @TODO: Fix HTML Types
	return node.parentNode as Element;
}

interface ImageComponentConfig {
	target: Element;
	props: {
		images: MeasuredImage[];
	};
}

type ComponentConfig = Record<number, ImageComponentConfig>;

window.addEventListener('load', async () => {
	const nodes = document.querySelectorAll('body *');

	const images = await load(Array.from(nodes));
	const measuredImages = measure(images);

	const componentConfiguration = measuredImages.reduce((acc, image, index): ComponentConfig => {
		if ((image.fileSize < 10 && image.fileSize >= 0) || (image.width < 250 && image.height < 100)) {
			console.info(`Skipping ${image.url} because it's too small`);
			return acc;
		}

		if (!image.node.parentNode) {
			console.error(`Image has no parent`, image.node);
			return acc;
		}

		const container = findContainer(image);

		if (!container) {
			console.error(`Could not find a parent for image`, image);
			return acc;
		}

		// Use the index in the array as a unique identifier.
		let id = parseInt(container?.dataset?.jetpackBoostGuideId);
		const images = acc[id]?.props.images || [];
		images.push(image);

		// If there's only one image, assume a new Svelte component needs to be created.
		if (images.length === 1) {
			acc[id] = {
				target: container,
				props: {
					images,
				},
			};
		}

		return acc;
	}, {} as Record<number, ImageComponentConfig>);

	const instances = Object.values(componentConfiguration).map(data => {
		const instance = new Main(data);
		return instance;
	});
});
