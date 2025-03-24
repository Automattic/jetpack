import { FC, ReactNode } from 'react';

type WelcomeTourImageProps = {
	nonAnimatedSrc: string | ReactNode;
	animatedSrc: string | ReactNode;
	width?: number;
	height?: number;
};

const WelcomeTourImage: FC< WelcomeTourImageProps > = ( {
	nonAnimatedSrc,
	animatedSrc,
	width = 400,
	height = 260,
} ) => {
	return (
		<picture className="myjetpack-onboarding-tour__image">
			<source srcSet={ nonAnimatedSrc } media="(prefers-reduced-motion: reduce)" />
			<img src={ animatedSrc } width={ width } height={ height } alt="" />
		</picture>
	);
};

export default WelcomeTourImage;
