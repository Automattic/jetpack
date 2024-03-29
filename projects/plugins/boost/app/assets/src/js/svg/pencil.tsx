export default function ( { className }: { className?: string } ) {
	return (
		<svg
			className={ className }
			width="16"
			height="16"
			viewBox="0 0 16 16"
			fill="#008710"
			xmlns="http://www.w3.org/2000/svg"
		>
			<mask
				id="mask0_3234_4810"
				style={ { maskType: 'luminance' } }
				maskUnits="userSpaceOnUse"
				x="2"
				y="1"
				width="13"
				height="13"
			>
				<path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M13.724 3.724L12.276 2.276C11.7553 1.75533 10.9113 1.75533 10.3907 2.276L9.33333 3.33333L12.6667 6.66666L13.724 5.60933C14.2447 5.08866 14.2447 4.24466 13.724 3.724ZM8.66667 4L12 7.33333L5.662 13.6713C5.20467 13.214 5.20267 12.4753 5.654 12.0147L5.652 12.0127C5.19133 12.464 4.45267 12.462 3.99533 12.0047C3.544 11.5533 3.538 10.83 3.97133 10.368L3.966 10.3627C3.504 10.7953 2.78 10.7893 2.32933 10.3387L8.66667 4ZM2 14V12C3.10467 12 4 12.8953 4 14H2Z"
					fill="white"
				/>
			</mask>
			<g mask="url(#mask0_3234_4810)">
				<rect width="16" height="16" />
			</g>
		</svg>
	);
}
