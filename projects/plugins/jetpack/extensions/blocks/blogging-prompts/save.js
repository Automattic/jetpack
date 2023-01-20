import { useBlockProps } from '@wordpress/block-editor';
import { __, _n, sprintf } from '@wordpress/i18n';
import icon from './icon';

function BloggingPromptsSave( { attributes } ) {
	const { answerCount, gravatars, prompt, prompt_id, showLabel, showResponses } = attributes;
	const blockProps = useBlockProps.save( { className: 'jetpack-blogging-prompts' } );

	return (
		<div { ...blockProps }>
			{ showLabel && (
				<div className="jetpack-blogging-prompts__label">
					{ icon }
					{ __( 'Daily writing prompt', 'jetpack' ) }
				</div>
			) }
			<div className="jetpack-blogging-prompts__prompt">{ prompt }</div>
			{ showResponses && (
				<div className="jetpack-blogging-prompts__answers">
					{ gravatars.map( ( { url } ) => {
						return (
							url && <img className="jetpack-blogging-prompts__answers-gravatar" src={ url } />
						);
					} ) }
					<a
						className="jetpack-blogging-prompts__answers-link"
						href={ `https://wordpress.com/tag/dailyprompt-${ prompt_id }` }
					>
						{ sprintf(
							// translators: %s is the number of responses.
							_n( 'View %s response', 'View all %s responses', answerCount, 'jetpack' ),
							answerCount
						) }
					</a>
				</div>
			) }
		</div>
	);
}

export default BloggingPromptsSave;
