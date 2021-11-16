export default function save( { attributes } ) {
	const { url } = attributes;
	if ( ! url || url === '' ) {
		return;
	}
	return (
		<a className="jetpack-podcast-player__direct-link" href={ url }>
			{ url }
		</a>
	);
}
