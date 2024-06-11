import { useBlockProps } from '@wordpress/block-editor';
import clsx from 'clsx';

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
		isBloganuary,
	} = attributes;

	const blockProps = useBlockProps.save( { className: 'jetpack-blogging-prompt' } );

	const labelClassnames = clsx( [ 'jetpack-blogging-prompt__label' ], {
		'is-bloganuary-icon': isBloganuary,
	} );

	return (
		<div { ...blockProps }>
			{ showLabel && <div className={ labelClassnames }>{ promptLabel }</div> }
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
