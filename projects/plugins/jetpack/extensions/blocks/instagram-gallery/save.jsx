import { useBlockProps } from '@wordpress/block-editor';

export default ( { attributes: { instagramUser } } ) => {
	const blockProps = useBlockProps.save();

	return (
		instagramUser && (
			<div { ...blockProps }>
				<a
					href={ `https://www.instagram.com/${ instagramUser }/` }
					rel="noopener noreferrer"
					target="_blank"
				>{ `https://www.instagram.com/${ instagramUser }/` }</a>
			</div>
		)
	);
};
