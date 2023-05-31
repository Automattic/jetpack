/*
 * External dependencies
 */
import { MenuItem, MenuGroup, ToolbarDropdownMenu } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { title, postContent, postExcerpt, termDescription, post, pencil } from '@wordpress/icons';
import React from 'react';

type PromptTemplatesControlProps = {
	hasContentBefore: boolean;
	hasContent: boolean;
	hasPostTitle: boolean;
	onPromptSelected: ( prompt: string ) => void;
	getSuggestionFromOpenAI: ( type: string, options?: object ) => void;
};

type PromptTemplateProps = {
	description: string;
	label: string;
};

export const defaultPromptTemplate = {
	label: __( 'Post about…', 'jetpack' ),
	description: __( 'Write a post about ', 'jetpack' ),
};

const promptTemplates = [
	defaultPromptTemplate,

	// {
	// 	label: __( 'Detailed guide on…', 'jetpack' ),
	// 	description: __( 'Craft a detailed guide ', 'jetpack' ),
	// },
	// {
	// 	label: __( 'Opinion on trends in…', 'jetpack' ),
	// 	description: __( 'Write an opinion piece on the current trends in ', 'jetpack' ),
	// },
	// {
	// 	label: __( 'Review about…', 'jetpack' ),
	// 	description: __( 'Write a review about ', 'jetpack' ),
	// },
	// {
	// 	label: __( 'Short story in…', 'jetpack' ),
	// 	description: __( 'Write a short story set in ', 'jetpack' ),
	// },
	{
		label: __( 'Informative article on…', 'jetpack' ),
		description: __( 'Craft an informative article explaining ', 'jetpack' ),
	},
	// {
	// 	label: __( 'Tribute to…', 'jetpack' ),
	// 	description: __( 'Write a tribute piece about ', 'jetpack' ),
	// },
	{
		label: __( 'Step-by-step tutorial on…', 'jetpack' ),
		description: __( 'Write a step-by-step tutorial on ', 'jetpack' ),
	},
	{
		label: __( 'Motivational post on…', 'jetpack' ),
		description: __( 'Create a motivational post on ', 'jetpack' ),
	},
	// {
	// 	label: __( 'Critical analysis of…', 'jetpack' ),
	// 	description: __( 'Write a critical analysis of ', 'jetpack' ),
	// },
];

export default function PromptTemplatesControl( {
	onPromptSelected,
	hasContentBefore,
	hasContent,
	hasPostTitle,
	getSuggestionFromOpenAI,
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
									onClick={ () => getSuggestionFromOpenAI( 'continue' ) }
								>
									{ __( 'Expand on preceding content', 'jetpack' ) }
								</MenuItem>
								<MenuItem
									icon={ termDescription }
									iconPosition="left"
									onClick={ () => getSuggestionFromOpenAI( 'correctSpelling' ) }
								>
									{ __( 'Correct spelling and grammar of preceding content', 'jetpack' ) }
								</MenuItem>
								<MenuItem
									icon={ post }
									iconPosition="left"
									onClick={ () => getSuggestionFromOpenAI( 'simplify' ) }
								>
									{ __( 'Simplify preceding content', 'jetpack' ) }
								</MenuItem>
							</MenuGroup>
						) }
						{ hasContent && (
							<MenuGroup label={ __( 'Based on entire content…', 'jetpack' ) }>
								{ hasContent && (
									<MenuItem
										icon={ postExcerpt }
										iconPosition="left"
										onClick={ () => getSuggestionFromOpenAI( 'summarize' ) }
									>
										{ __( 'Summarize', 'jetpack' ) }
									</MenuItem>
								) }
								{ hasContent && (
									<MenuItem
										icon={ title }
										iconPosition="left"
										onClick={ () => getSuggestionFromOpenAI( 'generateTitle' ) }
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
									onClick={ () => getSuggestionFromOpenAI( 'titleSummary' ) }
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
										onPromptSelected( prompt.description );
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
