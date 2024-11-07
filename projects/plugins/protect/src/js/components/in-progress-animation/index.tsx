import styles from './styles.module.scss';

const InProgressAnimation: React.FC = () => {
	return (
		<svg
			width="440"
			height="367"
			viewBox="0 0 440 367"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={ styles.inProgressAnimation }
		>
			<g className={ styles.inProgressAnimation__el }>
				<g filter="url(#filter_wordpress_el)">
					<rect className="rect-1" x="40" y="211" width="360" height="116" rx="4" fill="white" />
				</g>
				<path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M127 269C127 253.572 114.428 241 99 241C83.544 241 71 253.572 71 269C71 284.456 83.544 297 99 297C114.428 297 127 284.456 127 269ZM92.784 284.036L83.236 258.416C84.776 258.36 86.512 258.192 86.512 258.192C87.912 258.024 87.744 255.028 86.344 255.084C86.344 255.084 82.284 255.392 79.708 255.392C79.204 255.392 78.672 255.392 78.084 255.364C82.536 248.532 90.236 244.108 99 244.108C105.524 244.108 111.46 246.544 115.94 250.66C114.036 250.352 111.32 251.752 111.32 255.084C111.32 256.898 112.286 258.455 113.372 260.205L113.372 260.205C113.527 260.454 113.683 260.706 113.84 260.964C114.82 262.672 115.38 264.772 115.38 267.852C115.38 272.024 111.46 281.852 111.46 281.852L102.976 258.416C104.488 258.36 105.272 257.94 105.272 257.94C106.672 257.8 106.504 254.44 105.104 254.524C105.104 254.524 101.072 254.86 98.44 254.86C96.004 254.86 91.916 254.524 91.916 254.524C90.516 254.44 90.348 257.884 91.748 257.94L94.324 258.164L97.852 267.712L92.784 284.036ZM119.809 268.837L119.748 269C117.719 274.341 115.706 279.728 113.696 285.105L113.696 285.106L113.696 285.106L113.694 285.111C112.986 287.004 112.279 288.896 111.572 290.784C119.048 286.472 123.892 278.212 123.892 269C123.892 264.688 122.912 260.712 120.952 257.1C121.794 263.568 120.5 267.002 119.809 268.837ZM88.08 291.652C79.736 287.62 74.108 278.884 74.108 269C74.108 265.36 74.752 262.056 76.124 258.948C76.9623 261.244 77.8006 263.542 78.6392 265.841L78.6401 265.843L78.6404 265.844C81.7786 274.446 84.9206 283.058 88.08 291.652ZM106.588 292.632L99.364 273.088C98.0331 277.014 96.6922 280.941 95.3474 284.879C94.4288 287.568 93.5084 290.264 92.588 292.968C94.604 293.584 96.788 293.892 99 293.892C101.66 293.892 104.18 293.444 106.588 292.632Z"
					fill="#E9EFF5"
				/>
				<path
					d="M160 283C160 279.686 162.686 277 166 277H287C290.314 277 293 279.686 293 283C293 286.314 290.314 289 287 289H166C162.686 289 160 286.314 160 283Z"
					fill="#E9EFF5"
				/>
				<path
					d="M160 255C160 251.686 162.686 249 166 249H360C363.314 249 366 251.686 366 255C366 258.314 363.314 261 360 261H166C162.686 261 160 258.314 160 255Z"
					fill="#E9EFF5"
				/>
			</g>

			<g className={ styles.inProgressAnimation__el }>
				<g filter="url(#filter_plugins_el)">
					<rect x="72" y="68" width="168" height="120" rx="3" fill="#A0C5D7" />
				</g>
				<path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M152 108L152 118H159.5V108L163.25 108V118H167C168.381 118 169.5 119.119 169.5 120.5V130.5L162 140.5V145.5C162 146.881 160.881 148 159.5 148H152C150.619 148 149.5 146.881 149.5 145.5V140.5L142 130.5V120.5C142 119.119 143.119 118 144.5 118H148.25L148.25 108L152 108ZM153.25 139.25V144.25H158.25V139.25L165.75 129.25V121.75H145.75V129.25L153.25 139.25Z"
					fill="white"
				/>
			</g>

			<g className={ styles.inProgressAnimation__el }>
				<g filter="url(#filter_themes_el)">
					<rect x="272" y="40" width="96" height="132" rx="3" fill="#EED77B" />
				</g>
				<path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M320.238 122.25C326.583 122.25 331.726 117.107 331.726 110.762C331.726 109.608 331.141 107.683 329.776 105.088C328.472 102.609 326.691 99.9488 324.845 97.4584C323.206 95.2483 321.561 93.2314 320.238 91.6723C318.915 93.2314 317.27 95.2483 315.631 97.4584C313.785 99.9488 312.004 102.609 310.7 105.088C309.335 107.683 308.75 109.608 308.75 110.762C308.75 117.107 313.893 122.25 320.238 122.25ZM317.739 88.8229C313.417 93.8726 305 104.507 305 110.762C305 119.178 311.822 126 320.238 126C328.654 126 335.476 119.178 335.476 110.762C335.476 104.507 327.06 93.8726 322.737 88.8229C321.243 87.078 320.238 86 320.238 86C320.238 86 319.233 87.078 317.739 88.8229Z"
					fill="white"
				/>
			</g>

			<defs>
				<filter
					id="filter_wordpress_el"
					x="0"
					y="171"
					width="440"
					height="196"
					filterUnits="userSpaceOnUse"
					colorInterpolationFilters="sRGB"
				>
					<feFlood floodOpacity="0" result="BackgroundImageFix" />
					<feColorMatrix
						in="SourceAlpha"
						type="matrix"
						values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
						result="hardAlpha"
					/>
					<feOffset />
					<feGaussianBlur stdDeviation="20" />
					<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0" />
					<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_2754_20065" />
					<feBlend
						mode="normal"
						in="SourceGraphic"
						in2="effect1_dropShadow_2754_20065"
						result="shape"
					/>
				</filter>
				<filter
					id="filter_plugins_el"
					x="32"
					y="28"
					width="248"
					height="200"
					filterUnits="userSpaceOnUse"
					colorInterpolationFilters="sRGB"
				>
					<feFlood floodOpacity="0" result="BackgroundImageFix" />
					<feColorMatrix
						in="SourceAlpha"
						type="matrix"
						values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
						result="hardAlpha"
					/>
					<feOffset />
					<feGaussianBlur stdDeviation="20" />
					<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0" />
					<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_2754_20065" />
					<feBlend
						mode="normal"
						in="SourceGraphic"
						in2="effect1_dropShadow_2754_20065"
						result="shape"
					/>
				</filter>
				<filter
					id="filter_themes_el"
					x="232"
					y="0"
					width="176"
					height="212"
					filterUnits="userSpaceOnUse"
					colorInterpolationFilters="sRGB"
				>
					<feFlood floodOpacity="0" result="BackgroundImageFix" />
					<feColorMatrix
						in="SourceAlpha"
						type="matrix"
						values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
						result="hardAlpha"
					/>
					<feOffset />
					<feGaussianBlur stdDeviation="20" />
					<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0" />
					<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_2754_20065" />
					<feBlend
						mode="normal"
						in="SourceGraphic"
						in2="effect1_dropShadow_2754_20065"
						result="shape"
					/>
				</filter>
			</defs>
		</svg>
	);
};

export default InProgressAnimation;
