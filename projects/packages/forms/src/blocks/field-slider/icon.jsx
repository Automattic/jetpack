import { SVG, Circle, Line } from '@wordpress/primitives';

const icon = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
		<Line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="2" />
		<Circle cx="12" cy="12" r="2" fill="currentColor" />
	</SVG>
);

export default {
	src: icon,
};
