import { FC, ReactNode } from 'react';

type WelcomeTourImageProps = {
	nonAnimatedSrc: string | ReactNode;
	nonAnimatedSrc2x: string | ReactNode;
	animatedSrc: string;
	animatedSrc2x: string;
	width?: number;
	height?: number;
	className?: string;
};

const WelcomeTourImage: FC< WelcomeTourImageProps > = ( {
	nonAnimatedSrc,
	nonAnimatedSrc2x,
	animatedSrc,
	animatedSrc2x,
	className,
	width = 400,
	height = 260,
} ) => {
	return (
		<picture className={ className }>
			<source
				srcSet={ `${ nonAnimatedSrc } 1x, ${ nonAnimatedSrc2x } 2x` }
				media="(prefers-reduced-motion: reduce)"
			/>
			<img
				src={ animatedSrc }
				srcSet={ `${ animatedSrc } 1x, ${ animatedSrc2x } 2x` }
				width={ width }
				height={ height }
				alt=""
			/>
		</picture>
	);
};

export default WelcomeTourImage;
