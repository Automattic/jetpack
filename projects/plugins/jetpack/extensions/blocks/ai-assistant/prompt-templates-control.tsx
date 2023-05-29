/*
 * External dependencies
 */
import { MenuItem, MenuGroup, ToolbarDropdownMenu } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import React from 'react';

type PromptTemplatesControlProps = {
	onPromptSelected: ( prompt: string ) => void;
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

	{
		label: __( 'Detailed guide on…', 'jetpack' ),
		description: __( 'Craft a detailed guide ', 'jetpack' ),
	},
	{
		label: __( 'Opinion on trends in…', 'jetpack' ),
		description: __( 'Write an opinion piece on the current trends in ', 'jetpack' ),
	},
	{
		label: __( 'Review about…', 'jetpack' ),
		description: __( 'Write a review about ', 'jetpack' ),
	},
	{
		label: __( 'Short story in…', 'jetpack' ),
		description: __( 'Write a short story set in ', 'jetpack' ),
	},
	{
		label: __( 'Informative article on…', 'jetpack' ),
		description: __( 'Craft an informative article explaining ', 'jetpack' ),
	},
	{
		label: __( 'Tribute to…', 'jetpack' ),
		description: __( 'Write a tribute piece about ', 'jetpack' ),
	},
	{
		label: __( 'Motivational post on…', 'jetpack' ),
		description: __( 'Create a motivational post on ', 'jetpack' ),
	},
	{
		label: __( 'Step-by-step tutorial on…', 'jetpack' ),
		description: __( 'Write a step-by-step tutorial on ', 'jetpack' ),
	},
	{
		label: __( 'Critical analysis of…', 'jetpack' ),
		description: __( 'Write a critical analysis of ', 'jetpack' ),
	},
];

export default function PromptTemplatesControl( {
	onPromptSelected,
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
					<MenuGroup label={ label }>
						{ promptTemplates.map( ( prompt: PromptTemplateProps, i: number ) => (
							<MenuItem
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
				);
			} }
		</ToolbarDropdownMenu>
	);
}
