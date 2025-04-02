import { SVG } from '@wordpress/primitives';

const JetpackCRMIcon = props => (
	<SVG
		width="28"
		height="28"
		viewBox="0 0 28 28"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		{ ...props }
	>
		<path
			d="M14 28C21.732 28 28 21.732 28 14C28 6.26801 21.732 0 14 0C6.26801 0 0 6.26801 0 14C0 21.732 6.26801 28 14 28Z"
			fill="#069E08"
		/>
		<path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M13.4132 2.77881V16.3246H6.43994L13.4132 2.77881ZM14.8296 25.2215V11.649H21.8296L14.8296 25.2215Z"
			fill="white"
		/>
	</SVG>
);

export default JetpackCRMIcon;
