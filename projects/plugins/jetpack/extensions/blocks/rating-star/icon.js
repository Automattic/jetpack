import { Path, SVG } from '@wordpress/components';

export const StarBlockIcon = () => {
	return (
		<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
			<Path d="M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4V6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z" />
		</SVG>
	);
};

const getColor = props => ( props && props.color ? props.color : 'currentColor' );
const getClassName = props => ( props && props.className ? props.className : '' );

export const StarIcon = props => {
	const color = getColor( props );
	const className = getClassName( props );

	return (
		<SVG
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			color={ color } // this is to fix the stroke color in the ".is-style-filled svg:hover .is-rating-unfilled" rule
		>
			<Path
				className={ className }
				fill={ color }
				stroke={ color }
				d="M12,17.3l6.2,3.7l-1.6-7L22,9.2l-7.2-0.6L12,2L9.2,8.6L2,9.2L7.5,14l-1.6,7L12,17.3z"
			/>
		</SVG>
	);
};
