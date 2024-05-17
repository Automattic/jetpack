import { SVG, Circle } from '@wordpress/components';

export default ( {
	cx = 0,
	cy = 0,
	r = 4,
	fill = '#e34c84',
	stroke = '#ffffff',
	strokeWidth = '2',
} ) => {
	return (
		<SVG className="jetpack-paid-block-symbol">
			<Circle
				cx={ cx }
				cy={ cy }
				r={ r }
				fill={ fill }
				stroke={ stroke }
				strokeWidth={ strokeWidth }
			/>
		</SVG>
	);
};
