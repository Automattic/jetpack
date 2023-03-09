import { useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import icon from './icon';

function BloggingPromptSave( { attributes } ) {
	const { gravatars, prompt, promptId, showLabel, showResponses } = attributes;
	const blockProps = useBlockProps.save( { className: 'jetpack-blogging-prompt' } );

	return (
		<div { ...blockProps }>
			{ showLabel && (
				<div className="jetpack-blogging-prompt__label">
					{ icon }
					{ __( 'Daily writing prompt', 'jetpack' ) }
				</div>
			) }
			<div className="jetpack-blogging-prompt__prompt">{ prompt }</div>
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
						href={ `https://wordpress.com/tag/dailyprompt-${ promptId }` }
						target="_blank"
						rel="external noreferrer noopener"
					>
						{ __( 'View all responses', 'jetpack' ) }
					</a>
				</div>
			) }
		</div>
	);
}

export default BloggingPromptSave;
