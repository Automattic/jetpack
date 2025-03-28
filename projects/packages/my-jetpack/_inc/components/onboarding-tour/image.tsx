import { FC, ReactNode } from 'react';

type WelcomeTourImageProps = {
	nonAnimatedSrc: string | ReactNode;
	animatedSrc: string | ReactNode;
	width?: number;
	height?: number;
	className?: string;
};

const WelcomeTourImage: FC< WelcomeTourImageProps > = ( {
	nonAnimatedSrc,
	animatedSrc,
	className,
	width = 400,
	height = 260,
} ) => {
	return (
		<picture className={ className }>
			<source srcSet={ nonAnimatedSrc } media="(prefers-reduced-motion: reduce)" />
			<img src={ animatedSrc } width={ width } height={ height } alt="" />
		</picture>
	);
};

export default WelcomeTourImage;
