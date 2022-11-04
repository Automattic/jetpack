import './style.css';
import prototype from './prototype';
import { load } from './Images';
import { measure } from './Measurements';

import Info from './Info.svelte';

function closestStableParent(node: Element): Element | null {
	if (!node.parentNode) {
		return null;
	}

	if (!(node.parentNode instanceof Element)) {
		return null;
	}

	// Stop searching at body.
	if (node.parentNode.tagName === 'BODY') {
		return node.parentNode;
	}

	const position = getComputedStyle(node.parentNode).position;
	if (position === 'static' || position === 'relative') {
		return node.parentNode;
	}

	return closestStableParent(node.parentNode);
}

window.addEventListener('load', async () => {
	const nodes = document.querySelectorAll('body *');

	const images = await load(Array.from(nodes));
	const measuredImages = measure(images);

	// Create div and wrap image.node with that div
	const guide = document.createElement('div');
	guide.classList.add('jb-guide');

	for (const image of measuredImages) {
		const container = closestStableParent(image.node);

		if( image.width <= 64) {
			continue;
		}

		if (!container) {
			console.error(`Could not find relative parent for image`, image.node);
			continue;
		}

		if (!image.node.parentNode) {
			console.error(`Image has no parent`, image.node);
			continue;
		}

		// Wrap image.node in guide
		image.node.parentNode.insertBefore(guide, image.node);
		guide.appendChild(image.node);

		new Info({
			target: container,
			props: {
				image,
			},
		});
	}
});
