import { useBlockProps } from '@wordpress/block-editor';

function BloggingPromptSave( { attributes } ) {
	const {
		answersLink,
		answersLinkText,
		gravatars,
		promptId,
		promptLabel,
		promptText,
		showLabel,
		showResponses,
	} = attributes;
	const blockProps = useBlockProps.save( { className: 'jetpack-blogging-prompt' } );

	return (
		<div { ...blockProps }>
			{ showLabel && <div className="jetpack-blogging-prompt__label">{ promptLabel }</div> }
			<div className="jetpack-blogging-prompt__text">{ promptText }</div>
			{ showResponses && promptId && (
				<div className="jetpack-blogging-prompt__answers">
					{ gravatars.map( ( { url } ) => {
						return (
							url && (
								// eslint-disable-next-line jsx-a11y/alt-text
								<img
									className="jetpack-blogging-prompt__answers-gravatar"
									// Gravatar are decorative, here.
									aria-hidden="true"
									src={ url }
									key={ url }
								/>
							)
						);
					} ) }
					<a
						className="jetpack-blogging-prompt__answers-link"
						href={ answersLink }
						target="_blank"
						rel="external noreferrer noopener"
					>
						{ answersLinkText }
					</a>
				</div>
			) }
		</div>
	);
}

export default BloggingPromptSave;
