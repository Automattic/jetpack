import { Path, SVG } from '@wordpress/primitives';

export default function MaterialIcon( {
	children,
	width = 24,
	height = 24,
	viewbox = '0 0 24 24',
} ) {
	return (
		<SVG xmlns="http://www.w3.org/2000/svg" width={ width } height={ height } viewBox={ viewbox }>
			<Path fill="none" d="M0 0h24v24H0V0z" className="icon-filler" />
			{ children }
		</SVG>
	);
}
