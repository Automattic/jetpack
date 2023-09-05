/*
 * External dependencies
 */
import { MenuItem, MenuGroup, ToolbarDropdownMenu } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { title, postContent, postExcerpt, termDescription, post, pencil } from '@wordpress/icons';
/*
 * Internal dependencies
 */
import {
	PROMPT_TYPE_SUMMARY_BY_TITLE,
	PROMPT_TYPE_CONTINUE,
	PROMPT_TYPE_SIMPLIFY,
	PROMPT_TYPE_CORRECT_SPELLING,
	PROMPT_TYPE_GENERATE_TITLE,
	PROMPT_TYPE_SUMMARIZE,
} from '../../lib/prompt';

type PromptTemplatesControlProps = {
	hasContentBefore: boolean;
	hasContent: boolean;
	hasPostTitle: boolean;
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
		translated: __( 'Write a post about ', 'jetpack' ),
	},
};

const promptTemplates = [
	defaultPromptTemplate,
	// {
	// 	label: __( 'Detailed guide on…', 'jetpack' ),
	// 	description: {
	// 		original: 'Craft a detailed guide ',
	// 		translated: __( 'Craft a detailed guide ', 'jetpack' ),
	// 	},
	// },
	// {
	// 	label: __( 'Opinion on trends in…', 'jetpack' ),
	// 	description: {
	// 		original: 'Write an opinion piece on the current trends in ',
	// 		translated: __( 'Write an opinion piece on the current trends in ', 'jetpack' ),
	// 	},
	// },
	// {
	// 	label: __( 'Review about…', 'jetpack' ),
	// 	description: {
	// 		original: 'Write a review about ',
	// 		translated: __( 'Write a review about ', 'jetpack' ),
	// 	},
	// },
	// {
	// 	label: __( 'Short story in…', 'jetpack' ),
	// 	description: {
	// 		original: 'Write a short story set in ',
	// 		translated: __( 'Write a short story set in ', 'jetpack' ),
	// 	},
	// },
	{
		label: __( 'Informative article on…', 'jetpack' ),
		description: {
			original: 'Craft an informative article explaining ',
			translated: __( 'Craft an informative article explaining ', 'jetpack' ),
		},
	},
	// {
	// 	label: __( 'Tribute to…', 'jetpack' ),
	// 	description: {
	// 		original: 'Write a tribute piece about ',
	// 		translated: __( 'Write a tribute piece about ', 'jetpack' ),
	// 	},
	// },
	{
		label: __( 'Step-by-step tutorial on…', 'jetpack' ),
		description: {
			original: 'Write a step-by-step tutorial on ',
			translated: __( 'Write a step-by-step tutorial on ', 'jetpack' ),
		},
	},
	{
		label: __( 'Motivational post on…', 'jetpack' ),
		description: {
			original: 'Create a motivational post on ',
			translated: __( 'Create a motivational post on ', 'jetpack' ),
		},
	},
	// {
	// 	label: __( 'Critical analysis of…', 'jetpack' ),
	// 	description: {
	// 		original: 'Write a critical analysis of ',
	// 		translated: __( 'Write a critical analysis of ', 'jetpack' ),
	// 	},
	// },
];

export default function PromptTemplatesControl( {
	hasContentBefore,
	hasContent,
	hasPostTitle,
	onPromptSelect,
	onSuggestionSelect,
}: PromptTemplatesControlProps ) {
	const label = __( 'Write with AI…', 'jetpack' );

	return (
		<ToolbarDropdownMenu
			className="jetpack-ai-assistant__templates-control"
			icon={ null }
			label={ label }
			text={ label }
		>
			{ ( { onClose } ) => {
				return (
					<>
						{ hasContentBefore && (
							<MenuGroup label={ __( 'Based on preceding content…', 'jetpack' ) }>
								<MenuItem
									icon={ postContent }
									iconPosition="left"
									onClick={ () => onSuggestionSelect( PROMPT_TYPE_CONTINUE ) }
								>
									{ __( 'Continue writing', 'jetpack' ) }
								</MenuItem>
								<MenuItem
									icon={ termDescription }
									iconPosition="left"
									onClick={ () => onSuggestionSelect( PROMPT_TYPE_CORRECT_SPELLING ) }
								>
									{ __( 'Correct spelling and grammar', 'jetpack' ) }
								</MenuItem>
								<MenuItem
									icon={ post }
									iconPosition="left"
									onClick={ () => onSuggestionSelect( PROMPT_TYPE_SIMPLIFY ) }
								>
									{ __( 'Simplify', 'jetpack' ) }
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
										{ __( 'Summarize', 'jetpack' ) }
									</MenuItem>
								) }
								{ hasContent && (
									<MenuItem
										icon={ title }
										iconPosition="left"
										onClick={ () => onSuggestionSelect( PROMPT_TYPE_GENERATE_TITLE ) }
									>
										{ __( 'Generate a post title', 'jetpack' ) }
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
									{ __( 'Summary based on title', 'jetpack' ) }
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
