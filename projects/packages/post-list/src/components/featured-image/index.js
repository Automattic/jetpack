
export default function FeaturedImage( { url, id, thumb } ) {
	if ( ! id || ! url ) {
		return null;
	}

	return (
		<img
			className="post-feature-image"
			src={ thumb }
			width="50px"
			height="50px"
		/>
	);
}