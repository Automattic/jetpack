
export default function FeaturedImage( { url, id, thumb } ) {
	if ( ! url ) {
		return null;
	}

	return (
		<img
			className="post-featured-image"
			src={ thumb }
			width="50px"
			height="50px"
		/>
	);
}