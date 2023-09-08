/*
 * External dependencies
 */
import { aiAssistantIcon } from '@automattic/jetpack-ai-client';
import { ToolbarDropdownMenu, PanelBody, BottomSheet } from '@wordpress/components';
import { Platform } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { title, postContent, postExcerpt, termDescription, post, pencil } from '@wordpress/icons';

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

const PromptTemplate = ( { label, controls } ) => {
	return (
		<PanelBody title={ label } style={ { paddingLeft: 0, paddingRight: 0 } }>
			{ controls.map( ( control, indexOfControl ) => (
				<BottomSheet.Cell
					key={ indexOfControl }
					label={ control.title }
					onPress={ () => {
						if ( control.onPress ) {
							control.onPress();
						}
					} }
					editable={ false }
					icon={ control.icon }
					leftAlign={ true }
					isSelected={ control.isActive }
					separatorType={ Platform.OS === 'android' ? 'none' : 'leftMargin' }
				/>
			) ) }
		</PanelBody>
	);
};

export default function PromptTemplatesControl( {
	hasContentBefore,
	hasContent,
	hasPostTitle,
	onPromptSelect,
	onSuggestionSelect,
} ) {
	const label = __( 'Write with AI…', 'jetpack' );

	return (
		<ToolbarDropdownMenu icon={ aiAssistantIcon }>
			{ () => {
				return (
					<>
						{ hasContentBefore && (
							<PromptTemplate
								label={ __( 'Based on preceding content…', 'jetpack' ) }
								controls={ [
									{
										title: __( 'Continue writing', 'jetpack' ),
										icon: postContent,
										onPress: () => onSuggestionSelect( 'continue' ),
									},
									{
										title: __( 'Correct spelling and grammar', 'jetpack' ),
										icon: termDescription,
										onPress: () => onSuggestionSelect( 'correctSpelling' ),
									},
									{
										title: __( 'Simplify', 'jetpack' ),
										icon: post,
										onPress: () => onSuggestionSelect( 'simplify' ),
									},
								] }
							/>
						) }
						{ hasContent && (
							<PromptTemplate
								label={ __( 'Based on entire content…', 'jetpack' ) }
								controls={ [
									{
										title: __( 'Summarize', 'jetpack' ),
										icon: postExcerpt,
										onPress: () => onSuggestionSelect( 'summarize' ),
									},
									{
										title: __( 'Generate a post title', 'jetpack' ),
										icon: title,
										onPress: () => onSuggestionSelect( 'generateTitle' ),
									},
								] }
							/>
						) }
						<PromptTemplate
							label={ __( 'Write…', 'jetpack' ) }
							controls={ [
								hasPostTitle && {
									title: __( 'Summary based on title', 'jetpack' ),
									icon: pencil,
									onPress: () => onSuggestionSelect( 'titleSummary' ),
								},
								{
									title: __( 'Generate a post title', 'jetpack' ),
									icon: title,
									onPress: () => onSuggestionSelect( 'generateTitle' ),
								},
								...promptTemplates.map( prompt => ( {
									title: prompt.label,
									icon: pencil,
									onPress: () => {
										onPromptSelect( prompt.description );
									},
								} ) ),
							].filter( Boolean ) }
						/>
					</>
				);
			} }
		</ToolbarDropdownMenu>
	);
}
