/** A shield with a flame, for the firewall; Scan keeps the plain shield. */
const shieldFlame = (
	<svg
		viewBox="0 0 24 24"
		xmlns="http://www.w3.org/2000/svg"
		style={ { fill: 'none' } }
		stroke="currentColor"
		strokeWidth="1.5"
	>
		<path
			d="M18 6.75V10.5C18 14.4187 15.4956 17.7524 12 18.9879C8.50442 17.7524 6 14.4187 6 10.5V6.75L12 4L18 6.75Z"
			vectorEffect="non-scaling-stroke"
		/>
		<path
			d="M12 16.75C9.8 16.75 8.5 15.1 8.5 13.25C8.5 11.5 9.4 10.3 10.1 9.6C10.1 10.8 10.6 11.6 11.2 11.9C11 10 11.6 8.4 13 7.25C13.2 8.8 15.5 10.3 15.5 13.25C15.5 15.1 14.2 16.75 12 16.75Z"
			fill="currentColor"
			stroke="none"
		/>
	</svg>
);

export default shieldFlame;
