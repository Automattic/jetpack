import { Path, SVG, SVGProps } from '@wordpress/primitives';

const CloseSVG = ( props: SVGProps ) => {
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
				d="M28.0002 30.4751L36.6623 39.1371L39.1371 36.6623L30.4751 28.0002L39.1372 19.3382L36.6623 16.8633L28.0002 25.5254L19.3382 16.8633L16.8633 19.3382L25.5254 28.0002L16.8633 36.6623L19.3382 39.1372L28.0002 30.4751Z"
				fill="#D63638"
			/>
		</SVG>
	);
};

export default CloseSVG;
