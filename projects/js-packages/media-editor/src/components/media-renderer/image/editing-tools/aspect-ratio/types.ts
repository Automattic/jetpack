export interface AspectRatio {
	name: string;
	slug: string;
	ratio: number;
}

export interface AspectRatioComponentProps {
	onChange: ( aspectRatio: AspectRatio ) => void;
	aspectRatio: AspectRatio | null;
	imageAspectRatios: AspectRatio[];
	defaultRatios: AspectRatio[];
	themeRatios: AspectRatio[];
	className?: string;
	displayAspectRatioName?: boolean;
}
