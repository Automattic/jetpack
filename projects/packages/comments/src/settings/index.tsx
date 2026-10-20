/* @jsxImportSource react */
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import {
	DataForm,
	type DataFormControlProps,
	type DeepPartial,
	type Field,
} from '@wordpress/dataviews';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import {
	Button,
	Card,
	InputControl,
	Link,
	Spinner,
	Stack,
	SwitchControl,
	Text,
} from '@wordpress/ui';
import CommentFormPreview from './preview';
import type { CommentFormSettings, HostProps, SettingsData } from './types';
import type { ChangeEvent } from 'react';
import './style.scss';

type Settings = CommentFormSettings & { stb_enabled: boolean; stc_enabled: boolean };
type ControlProps = DataFormControlProps< Settings >;

const SAVED_KEYS: ( keyof CommentFormSettings )[] = [
	'comments',
	'jetpack_comments_images',
	'jetpack_comments_embeds',
	'highlander_comment_form_prompt',
];

/**
 * A switch for one boolean setting.
 *
 * @param {ControlProps} props - DataForm control props.
 * @return {JSX.Element} Switch.
 */
function Switch( { data, field, onChange }: ControlProps ) {
	const handleChange = useCallback(
		( checked: boolean ) => onChange( { [ field.id ]: checked } ),
		[ field.id, onChange ]
	);

	return (
		<SwitchControl
			label={ field.label }
			description={ field.description as string }
			checked={ !! data[ field.id ] }
			disabled={ field.isDisabled( { item: data, field } ) }
			onCheckedChange={ handleChange }
		/>
	);
}

/**
 * The comment form introduction.
 *
 * @param {ControlProps} props - DataForm control props.
 * @return {JSX.Element} Input.
 */
function Prompt( { data, field, onChange }: ControlProps ) {
	const handleChange = useCallback(
		( event: ChangeEvent< HTMLInputElement > ) =>
			onChange( { highlander_comment_form_prompt: event.target.value } ),
		[ onChange ]
	);

	return (
		<InputControl
			label={ field.label }
			description={ field.description as string }
			value={ data.highlander_comment_form_prompt ?? '' }
			disabled={ field.isDisabled( { item: data, field } ) }
			onChange={ handleChange }
		/>
	);
}

/**
 * The Comments module and the settings of the form it adds, with a live preview of that form.
 *
 * @param {SettingsData & HostProps} props - Props.
 * @return {JSX.Element} Card.
 */
export default function CommentFormSettingsCard( {
	preview,
	hasBlockEditor,
	isUnavailable = false,
	onSave,
	onDirtyChange,
	onToggle,
}: SettingsData & HostProps ) {
	const [ saved, setSaved ] = useState< Settings | null >( null );
	const [ data, setData ] = useState< Settings | null >( null );
	const [ isSaving, setIsSaving ] = useState( false );
	const { createErrorNotice, createSuccessNotice } = useDispatch( noticesStore );

	useEffect( () => {
		apiFetch< Settings >( { path: '/jetpack/v4/settings' } )
			.then( settings => {
				setSaved( settings );
				setData( settings );
			} )
			.catch( () =>
				createErrorNotice( __( 'Couldn’t load the comment settings.', 'jetpack-comments' ), {
					type: 'snackbar',
				} )
			);
	}, [ createErrorNotice ] );

	const changes = useMemo(
		() =>
			Object.fromEntries(
				SAVED_KEYS.filter( key => data && data[ key ] !== saved[ key ] ).map( key => [
					key,
					data[ key ],
				] )
			),
		[ data, saved ]
	);
	const hasChanges = Object.keys( changes ).length > 0;

	useEffect( () => {
		onDirtyChange?.( hasChanges );
	}, [ hasChanges, onDirtyChange ] );

	const handleChange = useCallback(
		( edits: DeepPartial< Settings > ) => {
			for ( const [ setting, value ] of Object.entries( edits ) ) {
				if ( 'boolean' === typeof value ) {
					onToggle?.( setting, value );
				}
			}
			setData( current => ( { ...current, ...edits } ) );
		},
		[ onToggle ]
	);

	const handleSave = useCallback( () => {
		setIsSaving( true );
		apiFetch( { path: '/jetpack/v4/settings', method: 'POST', data: changes } )
			.then( () => {
				setSaved( current => ( { ...current, ...changes } ) );
				createSuccessNotice( __( 'Comment settings saved.', 'jetpack-comments' ), {
					type: 'snackbar',
				} );
				onSave?.();
			} )
			.catch( () =>
				createErrorNotice( __( 'Couldn’t save the comment settings.', 'jetpack-comments' ), {
					type: 'snackbar',
				} )
			)
			.finally( () => setIsSaving( false ) );
	}, [ changes, createErrorNotice, createSuccessNotice, onSave ] );

	const isModuleOff = ( { item }: { item: Settings } ) => isUnavailable || ! item.comments;

	const fields: Field< Settings >[] = [
		{
			id: 'comments',
			label: __( 'Use the Jetpack comment form', 'jetpack-comments' ),
			description: __(
				'Replaces the standard WordPress comment form with one that includes social media login options.',
				'jetpack-comments'
			),
			type: 'boolean',
			Edit: Switch,
			isDisabled: isUnavailable,
		},
		{
			id: 'jetpack_comments_images',
			label: __( 'Allow images from links', 'jetpack-comments' ),
			type: 'boolean',
			Edit: Switch,
			isVisible: () => hasBlockEditor,
			isDisabled: isModuleOff,
		},
		{
			id: 'jetpack_comments_embeds',
			label: __( 'Allow embeds from YouTube, X, and other services', 'jetpack-comments' ),
			type: 'boolean',
			Edit: Switch,
			isVisible: () => hasBlockEditor,
			isDisabled: isModuleOff,
		},
		{
			id: 'highlander_comment_form_prompt',
			label: __( 'Comment form introduction', 'jetpack-comments' ),
			description: __(
				'A few catchy words to motivate your visitors to comment.',
				'jetpack-comments'
			),
			type: 'text',
			Edit: Prompt,
			isDisabled: isModuleOff,
		},
	];

	return (
		<Card.Root className="jetpack-comments-settings">
			<Card.Header>
				<Card.Title>{ __( 'Comment form', 'jetpack-comments' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				{ ! data ? (
					<Spinner />
				) : (
					<Stack direction="column" gap="xl">
						{ preview && (
							<Stack direction="column" gap="sm">
								<Text variant="heading-sm" render={ <h3 /> }>
									{ __( 'Preview', 'jetpack-comments' ) }
								</Text>
								<div className="jetpack-comments-settings__preview">
									<CommentFormPreview
										isJetpackForm={ data.comments }
										hasBlocks={ hasBlockEditor }
										prompt={ data.highlander_comment_form_prompt ?? '' }
										subscribeBlog={ !! data.stb_enabled }
										subscribeReplies={ !! data.stc_enabled }
										preview={ preview }
									/>
								</div>
								<Text variant="body-sm" className="jetpack-comments-settings__caption">
									{ data.comments
										? __(
												'The Jetpack form takes your theme’s fonts and colors.',
												'jetpack-comments'
											)
										: __(
												'Your theme styles its own comment form, so it may look different on your site.',
												'jetpack-comments'
											) }{ ' ' }
									{ ! preview.theme &&
										`${ __(
											'Your theme does not share its styles, so the preview uses plain fonts and colors.',
											'jetpack-comments'
										) } ` }
									{ __(
										'The preview shows the form as you see it while logged in.',
										'jetpack-comments'
									) }
								</Text>
							</Stack>
						) }
						<DataForm< Settings >
							data={ data }
							fields={ fields }
							form={ {
								layout: { type: 'regular', labelPosition: 'top' },
								fields: SAVED_KEYS,
							} }
							onChange={ handleChange }
						/>
						<Stack direction="row" justify="space-between" align="center">
							<Link
								openInNewTab
								href="https://jetpack.com/redirect/?source=jetpack-support-comments"
							>
								{ __( 'Learn more about Jetpack Comments', 'jetpack-comments' ) }
							</Link>
							<Button
								onClick={ handleSave }
								disabled={ ! hasChanges || isSaving }
								loading={ isSaving }
							>
								{ __( 'Save', 'jetpack-comments' ) }
							</Button>
						</Stack>
					</Stack>
				) }
			</Card.Content>
		</Card.Root>
	);
}
