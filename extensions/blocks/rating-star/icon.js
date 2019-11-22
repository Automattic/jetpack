/**
 * External dependencies
 */
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

export const ChiliIcon = props => {
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
				d="M13.8 9l1.2-.8c.6.3 1.1 1 1.1 1.8v11.8s-8-1.8-8-10.8v-1c0-.7.4-1.4 1-1.7l1.3.7L12 8l1.8 1zM10 2c1.5 0 2.8 1.1 3 2.6 1 .3 1.8 1 2.2 2l-1.5.9-1.8-1-1.6 1-1.5-.8c.4-1 1.2-1.7 2.2-2-.2-.4-.6-.7-1-.7V2z"
			/>
		</SVG>
	);
};

export const MoneyIcon = props => {
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
				d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"
			/>
		</SVG>
	);
};
