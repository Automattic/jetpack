/*
 * External dependencies
 */
import { MenuItem, MenuGroup, ToolbarDropdownMenu } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { tip } from '@wordpress/icons';
import React from 'react';

type PromptTemplatesControlProps = {
	onPromptSelected: ( prompt: string ) => void;
};

type PromptTemplateProps = {
	description: string;
	label: string;
};

const promptTemplates = [
	{
		label: __( 'Write a post about…', 'jetpack' ),
		description: __( 'Write a post about ', 'jetpack' ),
	},
	{
		label: __( 'Craft a detailed guide on how to…', 'jetpack' ),
		description: __( 'Craft a detailed guide ', 'jetpack' ),
	},
	{
		label: __( 'Write an opinion piece on the current trends in…', 'jetpack' ),
		description: __( 'Write an opinion piece on the current trends in ', 'jetpack' ),
	},
	{
		label: __( 'Write a review about…', 'jetpack' ),
		description: __( 'Write a review about ', 'jetpack' ),
	},
	{
		label: __( 'Write a short story set in…', 'jetpack' ),
		description: __( 'Write a short ', 'jetpack' ),
	},

	{
		label: __( 'Craft an informative article explaining…', 'jetpack' ),
		description: __( 'Craft an informative article ', 'jetpack' ),
	},
	{
		label: __( 'Write a tribute piece about…', 'jetpack' ),
		description: __( 'Write a tribute piece about ', 'jetpack' ),
	},
	{
		label: __( 'Create a motivational post on…', 'jetpack' ),
		description: __( 'Create a motivational post on ', 'jetpack' ),
	},
	{
		label: __( 'Write a step-by-step tutorial on…', 'jetpack' ),
		description: __( 'Write a step-by-step tutorial on ', 'jetpack' ),
	},
	{
		label: __( 'Write a critical analysis of…', 'jetpack' ),
		description: __( 'Write a critical analysis of ', 'jetpack' ),
	},
];

export default function PromptTemplatesControl( {
	onPromptSelected,
}: PromptTemplatesControlProps ) {
	return (
		<ToolbarDropdownMenu
			icon={ tip }
			popoverProps={ {
				variant: 'toolbar',
			} }
		>
			{ () => {
				return (
					<MenuGroup label={ __( 'Write about…', 'jetpack' ) }>
						{ promptTemplates.map( ( prompt: PromptTemplateProps, i: number ) => (
							<MenuItem
								key={ `key-${ i }` }
								onClick={ () => onPromptSelected( prompt.description ) }
							>
								{ prompt.description }
							</MenuItem>
						) ) }
					</MenuGroup>
				);
			} }
		</ToolbarDropdownMenu>
	);
}
