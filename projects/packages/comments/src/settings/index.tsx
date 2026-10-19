/* @jsxImportSource react */
import restApi from '@automattic/jetpack-api';
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
import type { CommentFormSettings, PreviewData } from './types';
import type { ChangeEvent } from 'react';
import './style.scss';

type Settings = CommentFormSettings & { stb_enabled: boolean; stc_enabled: boolean };
type ControlProps = DataFormControlProps< Settings >;

const SAVED_KEYS: ( keyof CommentFormSettings )[] = [
	'comments',
	'enable_blocks_comments',
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
 * A switch for a setting that only applies while blocks are on, set under that switch.
 *
 * @param {ControlProps} props - DataForm control props.
 * @return {JSX.Element} Indented switch.
 */
function BlockOption( props: ControlProps ) {
	return (
		<div className="jetpack-comments-settings__block-option">
			<Switch { ...props } />
		</div>
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

type CommentFormSettingsCardProps = {
	/** The form preview's data, or null where Jetpack Comments' new form isn't on. */
	preview: PreviewData | null;
	/** Whether readers can write in blocks. */
	hasBlockEditor: boolean;
	/** Whether the module can't be used, as in offline mode. */
	isUnavailable?: boolean;
	/** Called after a save, so the host can refresh what it holds. */
	onSave?: () => void;
};

/**
 * The Comments module and the settings of the form it adds, with a live preview of that form.
 *
 * @param {CommentFormSettingsCardProps} props - Props.
 * @return {JSX.Element} Card.
 */
export default function CommentFormSettingsCard( {
	preview,
	hasBlockEditor,
	isUnavailable = false,
	onSave,
}: CommentFormSettingsCardProps ) {
	const [ saved, setSaved ] = useState< Settings | null >( null );
	const [ data, setData ] = useState< Settings | null >( null );
	const [ isSaving, setIsSaving ] = useState( false );
	const { createErrorNotice, createSuccessNotice } = useDispatch( noticesStore );

	useEffect( () => {
		restApi
			.fetchSettings()
			.then( ( settings: Settings ) => {
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

	const handleChange = useCallback(
		( edits: DeepPartial< Settings > ) => setData( current => ( { ...current, ...edits } ) ),
		[]
	);

	const handleSave = useCallback( () => {
		setIsSaving( true );
		restApi
			.updateSettings( changes )
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
	const areBlocksOff = ( args: { item: Settings } ) =>
		isModuleOff( args ) || ! args.item.enable_blocks_comments;

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
			id: 'enable_blocks_comments',
			label: __( 'Enable blocks in comments', 'jetpack-comments' ),
			type: 'boolean',
			Edit: Switch,
			isVisible: () => hasBlockEditor,
			isDisabled: isModuleOff,
		},
		{
			id: 'jetpack_comments_images',
			label: __( 'Allow images from links', 'jetpack-comments' ),
			type: 'boolean',
			Edit: BlockOption,
			isVisible: () => hasBlockEditor,
			isDisabled: areBlocksOff,
		},
		{
			id: 'jetpack_comments_embeds',
			label: __( 'Allow embeds from YouTube, X, and other services', 'jetpack-comments' ),
			type: 'boolean',
			Edit: BlockOption,
			isVisible: () => hasBlockEditor,
			isDisabled: areBlocksOff,
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
										hasBlocks={ hasBlockEditor && data.enable_blocks_comments }
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
