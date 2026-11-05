import { getRedirectUrl } from '@automattic/jetpack-components';
import { DataForm } from '@wordpress/dataviews';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Card, InputControl, Link, Stack, SwitchControl } from '@wordpress/ui';
import { connect } from 'react-redux';
import analytics from 'lib/analytics';
import { isUnavailableInOfflineMode } from 'state/connection';
import {
	clearUnsavedSettingsFlag,
	getSettings,
	isUpdatingSetting,
	setUnsavedSettingsFlag,
	updateSettings,
} from 'state/settings';

const FIELDS = [
	'comments',
	'jetpack_comments_images',
	'jetpack_comments_embeds',
	'highlander_comment_form_prompt',
];

/**
 * A switch for one boolean setting.
 *
 * @param {object}   props          - DataForm control props.
 * @param {object}   props.data     - Settings.
 * @param {object}   props.field    - Field.
 * @param {Function} props.onChange - Change handler.
 * @return {object} Switch.
 */
function Switch( { data, field, onChange } ) {
	const handleChange = useCallback(
		checked => onChange( { [ field.id ]: checked } ),
		[ field.id, onChange ]
	);

	return (
		<SwitchControl
			label={ field.label }
			description={ field.description }
			checked={ !! data[ field.id ] }
			disabled={ field.isDisabled( { item: data, field } ) }
			onCheckedChange={ handleChange }
		/>
	);
}

/**
 * The comment form introduction.
 *
 * @param {object}   props          - DataForm control props.
 * @param {object}   props.data     - Settings.
 * @param {object}   props.field    - Field.
 * @param {Function} props.onChange - Change handler.
 * @return {object} Input.
 */
function Prompt( { data, field, onChange } ) {
	const handleChange = useCallback(
		event => onChange( { highlander_comment_form_prompt: event.target.value } ),
		[ onChange ]
	);

	return (
		<InputControl
			label={ field.label }
			description={ field.description }
			value={ data.highlander_comment_form_prompt ?? '' }
			disabled={ field.isDisabled( { item: data, field } ) }
			onChange={ handleChange }
		/>
	);
}

/**
 * The Comments module and the settings of the form it adds, saved together.
 *
 * @param {object} props - Props.
 * @return {object} Card.
 */
export function CommentForm( props ) {
	const { settings, isUnavailable, isSaving, setUnsaved } = props;
	const [ edits, setEdits ] = useState( {} );
	const data = { ...settings, ...edits };
	const changes = Object.fromEntries(
		Object.entries( edits ).filter( ( [ key, value ] ) => value !== settings[ key ] )
	);
	const hasChanges = Object.keys( changes ).length > 0;

	useEffect( () => {
		setUnsaved( hasChanges );
	}, [ hasChanges, setUnsaved ] );

	const handleChange = useCallback( change => {
		for ( const [ setting, value ] of Object.entries( change ) ) {
			if ( 'boolean' === typeof value ) {
				const toggled = value ? 'on' : 'off';
				analytics.tracks.recordEvent(
					'comments' === setting ? 'jetpack_wpa_module_toggle' : 'jetpack_wpa_settings_toggle',
					'comments' === setting
						? { module: 'comments', toggled }
						: { module: 'comments', setting, toggled }
				);
			}
		}
		setEdits( current => ( { ...current, ...change } ) );
	}, [] );

	const { updateSettings: saveSettings } = props;
	const handleSave = useCallback( () => {
		saveSettings( changes ).then( () => setEdits( {} ) );
	}, [ changes, saveSettings ] );

	const isModuleOff = ( { item } ) => isUnavailable || isSaving || ! item.comments;

	const fields = [
		{
			id: 'comments',
			label: __( 'Use the Jetpack comment form', 'jetpack' ),
			description: __(
				'Replaces the standard WordPress comment form with one that includes social media login options.',
				'jetpack'
			),
			type: 'boolean',
			Edit: Switch,
			isDisabled: () => isUnavailable || isSaving,
		},
		{
			id: 'jetpack_comments_images',
			label: __( 'Allow images from links', 'jetpack' ),
			type: 'boolean',
			Edit: Switch,
			isDisabled: isModuleOff,
		},
		{
			id: 'jetpack_comments_embeds',
			label: __( 'Allow embeds from YouTube, X, and other services', 'jetpack' ),
			type: 'boolean',
			Edit: Switch,
			isDisabled: isModuleOff,
		},
		{
			id: 'highlander_comment_form_prompt',
			label: __( 'Comment form introduction', 'jetpack' ),
			description: __( 'A few catchy words to motivate your visitors to comment.', 'jetpack' ),
			type: 'text',
			Edit: Prompt,
			isDisabled: isModuleOff,
		},
	];

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>{ __( 'Comment form', 'jetpack' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" gap="xl">
					<DataForm
						data={ data }
						fields={ fields }
						form={ { layout: { type: 'regular', labelPosition: 'top' }, fields: FIELDS } }
						onChange={ handleChange }
					/>
					<Stack direction="row" justify="space-between" align="center">
						<Link openInNewTab href={ getRedirectUrl( 'jetpack-support-comments' ) }>
							{ __( 'Learn more about Jetpack Comments', 'jetpack' ) }
						</Link>
						<Button
							onClick={ handleSave }
							disabled={ ! hasChanges || isSaving }
							loading={ isSaving }
						>
							{ __( 'Save', 'jetpack' ) }
						</Button>
					</Stack>
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}

export default connect(
	state => ( {
		settings: getSettings( state ),
		isUnavailable: isUnavailableInOfflineMode( state, 'comments' ),
		isSaving: isUpdatingSetting( state, FIELDS ),
	} ),
	dispatch => ( {
		updateSettings: changes => dispatch( updateSettings( changes ) ),
		// Leaving the tab with unsaved changes asks first, as it does for the dashboard's own forms.
		setUnsaved: isDirty =>
			dispatch( isDirty ? setUnsavedSettingsFlag() : clearUnsavedSettingsFlag() ),
	} )
)( CommentForm );
