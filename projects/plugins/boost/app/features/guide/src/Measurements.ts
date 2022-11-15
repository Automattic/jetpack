import type { MeasuredImage } from './types';

type Image = Omit<MeasuredImage, 'scaling' | 'onScreen'>;

export function measure(images: Image[]): MeasuredImage[] {
	return images.map(image => {
		const { width, height } = image.node.getBoundingClientRect();

		return {
			...image,
			onScreen: {
				width: Math.round(width),
				height: Math.round(height),
			},
			scaling: {
				width: image.width / width,
				height: image.height / height,
				oversizedBy: (image.width * image.height) / (width * height),
			},
		};
	});
}
