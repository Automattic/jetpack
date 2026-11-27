import { JETPACK_AI_SPARKLES } from '../../products-table-view/icons/jetpack-ai';

// Jetpack AI's sparkles cropped to a 24px glyph; `@wordpress/icons` has none.
export const aiSparkles = (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="17 17 30 30"
		aria-hidden="true"
		focusable="false"
	>
		{ JETPACK_AI_SPARKLES.map( d => (
			<path key={ d } d={ d } />
		) ) }
	</svg>
);
