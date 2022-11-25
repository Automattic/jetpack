import type { Image, MeasuredImage } from './types';

export function measure( images: Image[], dpr = window.devicePixelRatio || 1 ): MeasuredImage[] {
	return images.map( image => {
		const { width: sWidth, height: sHeight } = image.node.getBoundingClientRect();
		const oversizedBy =
			// Loaded image pixel count
			( image.fileSize.width * image.fileSize.height ) /
			// Image size on screen pixel count, multiplied by pixel density
			( sWidth * dpr * sHeight * dpr );

		return {
			...image,
			oversizedBy,
			onScreen: {
				width: Math.round( sWidth ),
				height: Math.round( sHeight ),
			},
			expected: {
				width: Math.round( sWidth * dpr ),
				height: Math.round( sHeight * dpr ),
			},
		};
	} );
}
