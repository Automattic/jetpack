const ExportSVG = props => {
	return (
		<svg
			width="132"
			height="50"
			viewBox="0 0 132 50"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			{ ...props }
		>
			<rect x="25" y="14" width="107" height="4" rx="2" fill="#256EFF" />
			<rect x="31" y="35" width="63" height="3" rx="1.5" fill="#1858D8" />
			<rect x="16" y="35" width="8" height="3" rx="1.5" fill="#1858D8" />
			<rect y="14" width="19" height="4" rx="2" fill="#256EFF" />
			<rect x="44" y="25" width="72" height="4" rx="2" fill="#357B49" />
			<rect x="16" y="25" width="23" height="4" rx="2" fill="#357B49" />
			<rect x="6" y="5" width="66" height="3" rx="1.5" fill="#6DBF85" />
			<rect width="127" height="50" fill="url(#paint0_linear_3308_44308)" />
			<defs>
				<linearGradient
					id="paint0_linear_3308_44308"
					x1="2.5"
					y1="25"
					x2="65.5"
					y2="25"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="white" />
					<stop offset="1" stopColor="white" stopOpacity="0" />
				</linearGradient>
			</defs>
		</svg>
	);
};

export default ExportSVG;
