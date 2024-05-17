export default function Column( { children, width } ) {
	const style = width ? { flexBasis: `${ width }%` } : undefined;
	return (
		<div className="tiled-gallery__col" style={ style }>
			{ children }
		</div>
	);
}
