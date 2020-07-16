/**
 * External dependencies
 */
import { Circle } from '@wordpress/components';

export default ( {
	cx = 21,
	cy = 3,
	r = 4,
	fill = '#e34c84',
	stroke = '#ffffff',
	strokeWidth = '1',
} ) => {
	return (
		<Circle
			className="jetpack-paid-block-symbol"
			cx={ cx }
			cy={ cy }
			r={ r }
			fill={ fill }
			stroke={ stroke }
			stroke-width={ strokeWidth }
		/>
	);
};
