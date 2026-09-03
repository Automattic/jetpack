import { useId } from 'react';

// The chart tile's line and fill from the Figma export. It stretches with the
// tile rather than keeping its ratio, as the design squeezes it too.
const AREA_PATH =
	'M33.5247 50.2215L14.332 60.4717C10.6599 62.4328 12.0534 68 16.2163 68H248.236C250.445 68 252.236 66.2091 252.236 64V8.97792C252.236 5.51539 248.135 3.6884 245.561 6.00396L225.807 23.7717C211.449 36.6866 190.497 39.1186 173.562 29.8363C159.8 22.2931 143.121 22.3828 129.44 30.0733L118.605 36.1645C107.169 42.5936 94.0331 45.3528 80.9766 44.0683L69.9404 42.9825C57.3532 41.7442 44.6813 44.2632 33.5247 50.2215Z';
const LINE_PATH =
	'M0.235544 68L33.5248 50.2215C44.6814 44.2632 57.3532 41.7442 69.9404 42.9825L80.9766 44.0683C94.0331 45.3528 107.169 42.5936 118.605 36.1645L129.424 30.0828C143.114 22.3863 159.807 22.2967 173.579 29.8456C190.508 39.1247 211.45 36.7073 225.82 23.8154L246.236 5.5';
const LINE_COLOR = '#3858e9';

type ChartArtworkProps = {
	className?: string;
};

export function ChartArtwork( { className }: ChartArtworkProps ) {
	// Unique per instance, so two charts on one page do not share a gradient.
	const gradientId = useId();

	return (
		<div className={ className }>
			<svg
				viewBox="0 0 252.236 68.441"
				preserveAspectRatio="none"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden="true"
				focusable="false"
			>
				<path d={ AREA_PATH } fill={ `url(#${ gradientId })` } />
				<path d={ LINE_PATH } stroke={ LINE_COLOR } vectorEffect="non-scaling-stroke" />
				<defs>
					<linearGradient
						id={ gradientId }
						x1="126.236"
						y1="68"
						x2="126.236"
						y2="0"
						gradientUnits="userSpaceOnUse"
					>
						<stop stopColor={ LINE_COLOR } stopOpacity="0" />
						<stop offset="1" stopColor={ LINE_COLOR } stopOpacity="0.5" />
					</linearGradient>
				</defs>
			</svg>
		</div>
	);
}
