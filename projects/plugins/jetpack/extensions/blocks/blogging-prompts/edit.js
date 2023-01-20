import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, ToggleControl } from '@wordpress/components';
import { __, _n, _x, sprintf } from '@wordpress/i18n';
import icon from './icon';

function BloggingPromptsEdit( { attributes, setAttributes } ) {
	const { answerCount, gravatars, prompt, prompt_id, showLabel, showResponses } = attributes;
	const blockProps = useBlockProps( { className: 'jetpack-blogging-prompts' } );

	const onShowLabelChange = newValue => {
		setAttributes( { showLabel: newValue } );
	};

	const onShowResponsesChange = newValue => {
		setAttributes( { showResponses: newValue } );
	};

	return (
		<div { ...blockProps }>
			<InspectorControls>
				<PanelBody title={ _x( 'Settings', 'title of block settings sidebar section', 'jetpack' ) }>
					<ToggleControl
						label={ __( 'Show daily prompt label', 'jetpack' ) }
						checked={ showLabel }
						onChange={ onShowLabelChange }
					/>
					<ToggleControl
						label={ __( 'Show other responses', 'jetpack' ) }
						checked={ showResponses }
						onChange={ onShowResponsesChange }
					/>
				</PanelBody>
			</InspectorControls>

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

export default BloggingPromptsEdit;
