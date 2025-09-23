export interface AspectRatio {
	name: string;
	slug: string;
	ratio: number;
}

export interface AspectRatioComponentProps {
	onChange: ( aspectRatio: AspectRatio ) => void;
	aspectRatio: AspectRatio;
	imageAspectRatios: AspectRatio[];
	defaultRatios: AspectRatio[];
	themeRatios: AspectRatio[];
	className?: string;
}
