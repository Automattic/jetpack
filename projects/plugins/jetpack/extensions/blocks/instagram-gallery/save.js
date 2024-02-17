export default ( { attributes: { instagramUser } } ) =>
	instagramUser && (
		<div>
			<a
				href={ `https://www.instagram.com/${ instagramUser }/` }
				rel="noopener noreferrer"
				target="_blank"
			>{ `https://www.instagram.com/${ instagramUser }/` }</a>
		</div>
	);
