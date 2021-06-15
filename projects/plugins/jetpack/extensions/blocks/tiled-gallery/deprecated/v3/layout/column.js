export default function Column( { children, width } ) {
	// This deprecation fixes inconsistent precision of flex-basis style decimal.
	// It needs to be adjusted here so that the style value matches the post
	// content to then trigger re-saving the block.
	const precision = Math.pow( 10, 12 ); // 1000000000000.
	const roundedWidth = Math.round( width * precision ) / precision;
	const style = width ? { flexBasis: `${ roundedWidth }%` } : undefined;

	return (
		<div className="tiled-gallery__col" style={ style }>
			{ children }
		</div>
	);
}
