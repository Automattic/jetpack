export const CustomLoadingSpinner = () => {
	return (
		<div className="custom-loading-spinner">
			<svg
				className="jetpack-spinner"
				width="16"
				height="16"
				viewBox="0 0 100 100"
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden="true"
				focusable="false"
			>
				<circle cx="50" cy="50" r="46" fill="none" stroke="#ddd" strokeWidth="8" />
				<path
					d="M 50 4 A 46 46 0 0 1 96 50"
					fill="none"
					stroke="currentColor"
					strokeWidth="8"
					strokeLinecap="round"
				>
					<animateTransform
						attributeName="transform"
						type="rotate"
						dur="1.4s"
						from="0 50 50"
						to="360 50 50"
						repeatCount="indefinite"
					/>
				</path>
			</svg>
		</div>
	);
};
