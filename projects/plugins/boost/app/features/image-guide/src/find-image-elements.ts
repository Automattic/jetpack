import { BackgroundImage, ImageTag, DOMElementWithImage } from './MeasurableElement';
import { MeasurableImage } from './MeasurableImage';

export function findMeasurableElements(nodes: Element[]): HTMLElement[] | HTMLImageElement[] {
	return nodes.filter((el): el is HTMLElement | HTMLImageElement => {
		if (el instanceof HTMLImageElement) {
			return true;
		}
		if (el instanceof HTMLElement) {
			const style = getComputedStyle(el);
			return 'none' !== style.backgroundImage;
		}
		return false;
	});
}

export function getMeasurableImages(domNodes: Element[]): MeasurableImage[] {
	const nodes = findMeasurableElements(domNodes);
	return nodes
		.map(node => {
			let image: DOMElementWithImage;

			if (node instanceof HTMLImageElement) {
				image = new ImageTag(node);
			}
			else if (node instanceof HTMLElement) {
				image = new BackgroundImage(node);

				/**
				 * Background elements that have no valid URL
				 * shouldn't be measured.
				 */
				if (!image.getURL()) {
					return null;
				}
			}

			return new MeasurableImage(image);
		})
		.filter(image => image !== null);
}
