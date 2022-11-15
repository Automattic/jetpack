export type MeasuredImage = {
	type: 'img' | 'srcset' | 'background';
	url: string;
	width: number;
	height: number;
	node: Element;
	fileSize: number;
	onScreen: {
		width: number;
		height: number;
	};
	scaling: {
		width: number;
		height: number;
		oversizedBy: number;
	};
};


export interface ImageComponentConfig {
	target: Element;
	props: {
		images: MeasuredImage[];
	};
}

