import { useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import icon from './icon';

function BloggingPromptsSave( { attributes } ) {
	const { gravatars, prompt, promptId, showLabel, showResponses } = attributes;
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
							url && (
								// eslint-disable-next-line jsx-a11y/alt-text
								<img
									className="jetpack-blogging-prompts__answers-gravatar"
									// Gravatar are decorative, here.
									aria-hidden="true"
									src={ url }
									key={ url }
								/>
							)
						);
					} ) }
					<a
						className="jetpack-blogging-prompts__answers-link"
						href={ `https://wordpress.com/tag/dailyprompt-${ promptId }` }
					>
						{ __( 'View all responses', 'jetpack' ) }
					</a>
				</div>
			) }
		</div>
	);
}

export default BloggingPromptsSave;
