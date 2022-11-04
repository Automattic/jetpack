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

	for (const image of measuredImages) {
		const container = closestStableParent(image.node);

		if ((image.fileSize < 10 && image.fileSize >= 0) || (image.width < 250 && image.height < 100)) {
			console.info(`Skipping ${image.url} because it's too small`);
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
		if (image.type === 'background') {
			new Info({
				target: image.node,
				props: {
					image,
					insertNode: false,
				},
			});
		} else {
			new Info({
				target: container,
				anchor: image.node.remove(),
				props: {
					image,
				},
			});
		}
	}
});
