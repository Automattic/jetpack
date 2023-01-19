import { useBlockProps } from '@wordpress/block-editor';
import { __, _n } from '@wordpress/i18n';

function BloggingPromptsEdit( { attributes, setAttributes } ) {
	const { answerCount, gravatars, prompt, prompt_id, showLabel, showAnswers } = attributes;
	const blockProps = useBlockProps();

	return (
		<div { ...blockProps }>
			{ showLabel && (
				<div className="jetpack-blogging-prompt__label">
					💡 { __( 'Daily writing prompt', 'jetpack' ) }
				</div>
			) }
			<div className="jetpack-blogging-prompt__prompt">{ prompt }</div>
			{ showAnswers && (
				<div className="jetpack-blogging-prompt__answers">
					{ gravatars.map( ( { avatar } ) => {
						return avatar && <img src={ avatar } />;
					} ) }
					<a href={ `https://wordpress.com/tag/dailyprompt-${ prompt_id }` }>
						{ _n( 'View %s response', 'View all %s responses', answerCount, 'jetpack' ) }
					</a>
				</div>
			) }
		</div>
	);
}

export default BloggingPromptsEdit;
