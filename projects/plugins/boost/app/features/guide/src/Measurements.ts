import type { Image } from './Images';

export interface MeasuredImage extends Image {
	onScreen: {
		width: number;
		height: number;
	};
}

export interface ComparedImage extends MeasuredImage {
	scaling: {
		width: number;
		height: number;
		pixels: number;
	};
}

function compareDimensions( image: MeasuredImage ) {
	const onScreen = image.onScreen;

	return {
		width: image.width / onScreen.width,
		height: image.height / onScreen.height,
		pixels: ( image.width * image.height ) / ( onScreen.width * onScreen.height ),
	};
}

export function measure( images: Image[] ): ComparedImage[] {
	return images.map( image => {
		const { width, height } = image.node.getBoundingClientRect();

		const measuredImage = {
			...image,
			onScreen: {
				width: Math.round( width ),
				height: Math.round( height ),
			},
		};

		return {
			scaling: compareDimensions( measuredImage ),
			...measuredImage,
		};
	} );
}
