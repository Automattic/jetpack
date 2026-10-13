/* @jsxImportSource react */
import { TextControl } from '@wordpress/components';
import { DataForm, type Field } from '@wordpress/dataviews';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Stack, Text } from '@wordpress/ui';
import { SectionCard, ToggleEdit, overrideNote } from '../components';
import { CommentFormPreview } from '../preview/comment-form-preview';
import type { CommentsScriptData, Settings } from '../types';
import type { SaveSettings } from '../use-settings';
import type { FormEvent, JSX } from 'react';

const LAYOUT = { layout: { type: 'regular' as const, labelPosition: 'top' as const } };

/**
 * The Comments module, the settings that only apply while it is on, and a preview of the form readers get.
 *
 * @param props            - Props.
 * @param props.settings   - Settings.
 * @param props.save       - Save function.
 * @param props.scriptData - Script data.
 * @return Section.
 */
export function CommentFormSection( {
	settings,
	save,
	scriptData,
}: {
	settings: Settings;
	save: SaveSettings;
	scriptData: CommentsScriptData;
} ): JSX.Element {
	const saved = settings.highlander_comment_form_prompt;
	// Null follows the stored heading; a string is the user's own text until a save lands.
	const [ draft, setDraft ] = useState< string | null >( null );
	const [ isSaving, setIsSaving ] = useState( false );
	const prompt = draft ?? saved;
	const isDirty = draft !== null && draft !== saved;

	const handleSubmit = useCallback(
		async ( event: FormEvent ) => {
			event.preventDefault();
			if ( ! isDirty || isSaving ) {
				return;
			}
			const submitted = prompt;
			setIsSaving( true );
			const ok = await save( { highlander_comment_form_prompt: submitted } );
			setIsSaving( false );
			// Show what was stored, unless the user typed on during the request.
			if ( ok ) {
				setDraft( current => ( current === submitted ? null : current ) );
			}
		},
		[ isDirty, isSaving, prompt, save ]
	);

	const onChange = useCallback( ( edits: Partial< Settings > ) => save( edits ), [ save ] );

	const moduleFields: Field< Settings >[] = [
		{
			id: 'comments',
			label: __( 'Use the Jetpack comment form', 'jetpack-comments' ),
			description:
				overrideNote( scriptData.overrides.comments ) ??
				__(
					'Replaces your theme’s comment form with one readers can sign in to with WordPress.com.',
					'jetpack-comments'
				),
			type: 'boolean',
			isDisabled: !! scriptData.overrides.comments,
			Edit: ToggleEdit,
		},
	];

	const formFields: Field< Settings >[] = [
		{
			id: 'enable_blocks_comments',
			label: __( 'Let readers format comments with blocks', 'jetpack-comments' ),
			description: __(
				'Adds a toolbar for lists, quotes, code, and links above the comment box.',
				'jetpack-comments'
			),
			type: 'boolean',
			Edit: ToggleEdit,
		},
	];

	return (
		<SectionCard
			title={ __( 'Comment form', 'jetpack-comments' ) }
			description={ __(
				'Choose the form readers use to comment, and see how it looks with your theme.',
				'jetpack-comments'
			) }
		>
			<DataForm< Settings >
				data={ settings }
				fields={ moduleFields }
				form={ { ...LAYOUT, fields: [ 'comments' ] } }
				onChange={ onChange }
			/>
			<fieldset className="jetpack-comments-settings__group" disabled={ ! settings.comments }>
				<Stack direction="column" gap="xl">
					<form onSubmit={ handleSubmit }>
						<Stack direction="column" gap="lg">
							<TextControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={ __( 'Form heading', 'jetpack-comments' ) }
								help={ __(
									'A few words to invite readers to comment. Leave it empty to use your theme’s heading.',
									'jetpack-comments'
								) }
								placeholder={ __( 'Leave a Reply', 'jetpack-comments' ) }
								value={ prompt }
								onChange={ setDraft }
							/>
							<Stack direction="row" justify="flex-end">
								<Button type="submit" disabled={ ! isDirty } loading={ isSaving }>
									{ __( 'Save', 'jetpack-comments' ) }
								</Button>
							</Stack>
						</Stack>
					</form>
					<DataForm< Settings >
						data={ settings }
						fields={ formFields }
						form={ { ...LAYOUT, fields: [ 'enable_blocks_comments' ] } }
						onChange={ onChange }
					/>
				</Stack>
			</fieldset>
			<Stack direction="column" gap="md">
				<Text variant="heading-sm" render={ <h3 /> }>
					{ __( 'Preview', 'jetpack-comments' ) }
				</Text>
				<div className="jetpack-comments-settings__preview">
					<CommentFormPreview
						isJetpackForm={ settings.comments }
						hasBlocks={ settings.enable_blocks_comments }
						prompt={ prompt }
						discussion={ scriptData.discussion }
						newsletter={ scriptData.newsletter }
						preview={ scriptData.preview }
					/>
				</div>
				<Text variant="body-sm" render={ <p /> }>
					{ settings.comments
						? __(
								'The Jetpack form takes your theme’s fonts and colors. Readers add their name or sign in when they post.',
								'jetpack-comments'
							)
						: __(
								'Your theme styles its own comment form, so it may look different on your site.',
								'jetpack-comments'
							) }
					{ ! scriptData.preview.theme &&
						` ${ __(
							'Your theme does not share its styles, so the preview uses plain fonts and colors.',
							'jetpack-comments'
						) }` }
				</Text>
			</Stack>
		</SectionCard>
	);
}
