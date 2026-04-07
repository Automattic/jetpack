import { SVG } from '@wordpress/components';

const renderMaterialIcon =
	( svg, width = 24, height = 24, viewbox = '0 0 24 24' ) =>
	() => (
		<SVG xmlns="http://www.w3.org/2000/svg" width={ width } height={ height } viewBox={ viewbox }>
			{ svg }
		</SVG>
	);

export default renderMaterialIcon;
