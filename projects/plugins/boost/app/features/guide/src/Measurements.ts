import type { MeasuredImage } from './types';

type Image = Omit< MeasuredImage, 'scaling' | 'onScreen' >;

export function measure( images: Image[] ): MeasuredImage[] {
	return images.map( image => {
		const { width, height } = image.node.getBoundingClientRect();

		return {
			...image,
			onScreen: {
				width: Math.round( width ),
				height: Math.round( height ),
			},
			scaling: {
				width: image.fileSize.width / width,
				height: image.fileSize.height / height,
				oversizedBy: ( image.fileSize.width * image.fileSize.height ) / ( width * height ),
			},
		};
	} );
}
