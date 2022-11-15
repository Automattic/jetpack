
export type Image = {
	type: 'img' | 'srcset' | 'background';
	url: string;
	width: number;
	height: number;
	node: Element;
	fileSize: number;
};

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



export interface ImageComponentConfig {
	target: Element;
	props: {
		images: MeasuredImage[];
	};
}

