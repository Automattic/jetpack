/**
 * External dependencies
 */
import { Path, SVG, SVGProps } from '@wordpress/primitives';

const CheckSVG = ( props: SVGProps ) => {
	return (
		<SVG
			width="56"
			height="56"
			viewBox="0 0 56 56"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			role="img"
			{ ...props }
		>
			<Path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M41.833 18.615L25.0371 41.2036L14.499 33.368L16.5874 30.5593L24.3169 36.3066L39.0243 16.5266L41.833 18.615Z"
				fill="#008710"
			/>
		</SVG>
	);
};

export default CheckSVG;
