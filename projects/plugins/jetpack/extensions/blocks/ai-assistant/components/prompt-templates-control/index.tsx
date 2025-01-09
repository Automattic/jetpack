/*
 * External dependencies
 */
import {
	CORRECT_SPELLING_LABEL,
	GENERATE_TITLE_LABEL,
	PROMPT_TYPE_CONTINUE,
	PROMPT_TYPE_GENERATE_TITLE,
	PROMPT_TYPE_SUMMARY_BY_TITLE,
	SIMPLIFY_LABEL,
	SUMMARIZE_LABEL,
	SUMMARY_BASED_ON_TITLE_LABEL,
	CONTINUE_LABEL,
	PROMPT_TYPE_SUMMARIZE,
	PROMPT_TYPE_SIMPLIFY,
	PROMPT_TYPE_CORRECT_SPELLING,
} from '@automattic/jetpack-ai-client';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { MenuItem, MenuGroup, ToolbarDropdownMenu } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { title, postContent, postExcerpt, termDescription, post, pencil } from '@wordpress/icons';

type PromptTemplatesControlProps = {
	hasContentBefore: boolean;
	hasContent: boolean;
	hasPostTitle: boolean;
	contentIsLoaded: boolean;
	onPromptSelect: ( prompt: { original: string; translated: string } ) => void;
	onSuggestionSelect: ( suggestion: string ) => void;
};

type PromptTemplateProps = {
	description: {
		original: string;
		translated: string;
	};
	label: string;
};

export const defaultPromptTemplate = {
	label: __( 'Post about…', 'jetpack' ),
	description: {
		original: 'Write a post about ',
		translated: __( 'Write a post about', 'jetpack' ) + ' ',
	},
};

export const promptTemplates = [
	defaultPromptTemplate,
	{
		label: __( 'Informative article on…', 'jetpack' ),
		description: {
			original: 'Craft an informative article explaining ',
			translated: __( 'Craft an informative article explaining', 'jetpack' ) + ' ',
		},
	},
	{
		label: __( 'Step-by-step tutorial on…', 'jetpack' ),
		description: {
			original: 'Write a step-by-step tutorial on ',
			translated: __( 'Write a step-by-step tutorial on', 'jetpack' ) + ' ',
		},
	},
	{
		label: __( 'Motivational post on…', 'jetpack' ),
		description: {
			original: 'Create a motivational post on ',
			translated: __( 'Create a motivational post on', 'jetpack' ) + ' ',
		},
	},
];

export const promptTemplatesForGeneratedContent = [
	{
		label: __( 'Say it differently…', 'jetpack' ),
		description: {
			original: 'Rewrite it in a way that ',
			translated: __( 'Rewrite it in a way that', 'jetpack' ) + ' ',
		},
	},
	{
		label: __( 'Add…', 'jetpack' ),
		description: {
			original: 'Add more details about ',
			translated: __( 'Add more details about', 'jetpack' ) + ' ',
		},
	},
	{
		label: __( 'Remove…', 'jetpack' ),
		description: {
			original: 'Remove unnecessary details about ',
			translated: __( 'Remove unnecessary details about', 'jetpack' ) + ' ',
		},
	},
];

export default function PromptTemplatesControl( {
	hasContentBefore,
	hasContent,
	hasPostTitle,
	contentIsLoaded,
	onPromptSelect,
	onSuggestionSelect,
}: PromptTemplatesControlProps ) {
	const label = __( 'Write with AI…', 'jetpack' );

	const { tracks } = useAnalytics();

	const toggleHandler = isOpen => {
		if ( isOpen ) {
			tracks.recordEvent( 'jetpack_ai_assistant_block_toolbar_menu_show', {
				tool: 'write-with-ai',
			} );
		}
	};

	return (
		<ToolbarDropdownMenu
			className="jetpack-ai-assistant__templates-control"
			icon={ null }
			label={ label }
			text={ label }
			onToggle={ toggleHandler }
		>
			{ ( { onClose } ) => {
				return contentIsLoaded ? (
					<MenuGroup label={ __( 'Write…', 'jetpack' ) }>
						{ promptTemplatesForGeneratedContent.map(
							( prompt: PromptTemplateProps, i: number ) => (
								<MenuItem
									icon={ pencil }
									iconPosition="left"
									key={ `key-${ i }` }
									onClick={ () => {
										onClose();
										onPromptSelect( prompt.description );
									} }
								>
									{ prompt.label }
								</MenuItem>
							)
						) }
					</MenuGroup>
				) : (
					<>
						{ hasContentBefore && (
							<MenuGroup label={ __( 'Based on preceding content…', 'jetpack' ) }>
								<MenuItem
									icon={ postContent }
									iconPosition="left"
									onClick={ () => onSuggestionSelect( PROMPT_TYPE_CONTINUE ) }
								>
									{ CONTINUE_LABEL }
								</MenuItem>
								<MenuItem
									icon={ termDescription }
									iconPosition="left"
									onClick={ () => onSuggestionSelect( PROMPT_TYPE_CORRECT_SPELLING ) }
								>
									{ CORRECT_SPELLING_LABEL }
								</MenuItem>
								<MenuItem
									icon={ post }
									iconPosition="left"
									onClick={ () => onSuggestionSelect( PROMPT_TYPE_SIMPLIFY ) }
								>
									{ SIMPLIFY_LABEL }
								</MenuItem>
							</MenuGroup>
						) }
						{ hasContent && (
							<MenuGroup label={ __( 'Based on entire content…', 'jetpack' ) }>
								{ hasContent && (
									<MenuItem
										icon={ postExcerpt }
										iconPosition="left"
										onClick={ () => onSuggestionSelect( PROMPT_TYPE_SUMMARIZE ) }
									>
										{ SUMMARIZE_LABEL }
									</MenuItem>
								) }
								{ hasContent && (
									<MenuItem
										icon={ title }
										iconPosition="left"
										onClick={ () => onSuggestionSelect( PROMPT_TYPE_GENERATE_TITLE ) }
									>
										{ GENERATE_TITLE_LABEL }
									</MenuItem>
								) }
							</MenuGroup>
						) }
						<MenuGroup label={ __( 'Write…', 'jetpack' ) }>
							{ hasPostTitle && (
								<MenuItem
									icon={ pencil }
									iconPosition="left"
									onClick={ () => onSuggestionSelect( PROMPT_TYPE_SUMMARY_BY_TITLE ) }
								>
									{ SUMMARY_BASED_ON_TITLE_LABEL }
								</MenuItem>
							) }
							{ promptTemplates.map( ( prompt: PromptTemplateProps, i: number ) => (
								<MenuItem
									icon={ pencil }
									iconPosition="left"
									key={ `key-${ i }` }
									onClick={ () => {
										onClose();
										onPromptSelect( prompt.description );
									} }
								>
									{ prompt.label }
								</MenuItem>
							) ) }
						</MenuGroup>
					</>
				);
			} }
		</ToolbarDropdownMenu>
	);
}
