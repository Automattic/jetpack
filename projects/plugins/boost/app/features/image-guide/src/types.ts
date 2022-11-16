export type MeasuredImage = {
	type: 'img' | 'srcset' | 'background';
	url: string;
	node: Element;
	fileSize: {
		width: number;
		height: number;
		weight: number;
	};
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

export type GuideSize = 'normal' | 'small' | 'micro';
