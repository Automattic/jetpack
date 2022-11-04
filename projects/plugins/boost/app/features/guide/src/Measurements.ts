import type { Image } from './Images';

export interface MeasuredImage extends Image {
	onScreen: {
		width: number;
		height: number;
	};
}

export const measure = (images: Image[]) => {
	return images.map(image => {
		const { width, height } = image.node.getBoundingClientRect();

		return {
			...image,
			onScreen: {
				width,
				height,
			},
		};
	});
};
