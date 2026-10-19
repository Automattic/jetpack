import { getRedirectUrl } from '@automattic/jetpack-components';
import { DataForm } from '@wordpress/dataviews';
import { createContext, useCallback, useContext } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Card, Link, Stack, SwitchControl } from '@wordpress/ui';
import { connect } from 'react-redux';
import analytics from 'lib/analytics';
import { isUnavailableInOfflineMode } from 'state/connection';
import { getModule, getModuleOverride } from 'state/modules';
import { isModuleFound } from 'state/search';
import { getSettings, isUpdatingSetting, updateSettings } from 'state/settings';

// DataForm keeps only the field keys it knows, so each field's support links come from here.
const LinksContext = createContext( {} );

/**
 * A switch for one setting, with its support links.
 *
 * @param {object}   props          - DataForm control props.
 * @param {object}   props.data     - Settings.
 * @param {object}   props.field    - Field.
 * @param {Function} props.onChange - Change handler.
 * @return {object} Switch.
 */
function Switch( { data, field, onChange } ) {
	const { learnMore, privacy } = useContext( LinksContext )[ field.id ];
	const handleChange = useCallback(
		checked => onChange( { [ field.id ]: checked } ),
		[ field.id, onChange ]
	);

	return (
		<SwitchControl
			label={ field.label }
			checked={ !! data[ field.id ] }
			disabled={ field.isDisabled( { item: data, field } ) }
			onCheckedChange={ handleChange }
			details={
				<Stack direction="row" gap="md">
					<Link openInNewTab href={ learnMore }>
						{ __( 'Learn more', 'jetpack' ) }
					</Link>
					<Link openInNewTab href={ privacy }>
						{ __( 'Privacy information', 'jetpack' ) }
					</Link>
				</Stack>
			}
		/>
	);
}

/**
 * Comment features that work with any comment form, each saved as it's switched.
 *
 * @param {object} props - Props.
 * @return {object|null} Card, or null when search hides every feature.
 */
export function CommentFeatures( props ) {
	const { settings, isFound, isUpdating } = props;
	const gravatar = props.getModule( 'gravatar-hovercards' );
	const markdown = props.getModule( 'markdown' );
	const links = {
		'gravatar-hovercards': {
			learnMore: gravatar?.learn_more_button,
			privacy: gravatar?.learn_more_button + '#privacy',
		},
		wpcom_publish_comments_with_markdown: {
			learnMore: markdown?.learn_more_button,
			privacy: markdown?.learn_more_button + '#privacy',
		},
		'comment-likes': {
			learnMore: getRedirectUrl( 'jetpack-support-comment-likes' ),
			privacy: getRedirectUrl( 'jetpack-support-comment-likes', { anchor: 'privacy' } ),
		},
	};

	const fields = [
		{
			id: 'gravatar-hovercards',
			label: gravatar?.description,
			isVisible: () => isFound( 'gravatar-hovercards' ),
			isDisabled: () => isUpdating( 'gravatar-hovercards' ),
		},
		{
			id: 'wpcom_publish_comments_with_markdown',
			label: __( 'Enable Markdown use for comments', 'jetpack' ),
			isVisible: () => isFound( 'markdown' ),
			isDisabled: () =>
				isUpdating( [ 'markdown', 'wpcom_publish_comments_with_markdown' ] ) ||
				'inactive' === props.getModuleOverride( 'markdown' ),
		},
		{
			id: 'comment-likes',
			label: __( 'Enable comment Likes', 'jetpack' ),
			isVisible: () => isFound( 'comment-likes' ),
			isDisabled: () =>
				props.isUnavailableInOfflineMode( 'comment-likes' ) || isUpdating( 'comment-likes' ),
		},
	].map( field => ( { ...field, type: 'boolean', Edit: Switch } ) );

	const { updateSettings: saveSettings } = props;
	const handleChange = useCallback(
		edits => {
			const [ [ id, value ] ] = Object.entries( edits );
			const module = 'wpcom_publish_comments_with_markdown' === id ? 'markdown' : id;

			analytics.tracks.recordEvent(
				module === id ? 'jetpack_wpa_module_toggle' : 'jetpack_wpa_settings_toggle',
				{ module, setting: id, toggled: value ? 'on' : 'off' }
			);
			// Markdown in comments needs the Markdown module, so turning it on turns that on too.
			saveSettings(
				value && ! settings.markdown && module !== id ? { ...edits, markdown: true } : edits
			);
		},
		[ saveSettings, settings.markdown ]
	);

	if ( ! fields.some( field => field.isVisible() ) ) {
		return null;
	}

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>{ __( 'Comment features', 'jetpack' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				<LinksContext.Provider value={ links }>
					<DataForm
						data={ settings }
						fields={ fields }
						form={ {
							layout: { type: 'regular', labelPosition: 'top' },
							fields: fields.map( field => field.id ),
						} }
						onChange={ handleChange }
					/>
				</LinksContext.Provider>
			</Card.Content>
		</Card.Root>
	);
}

export default connect(
	state => ( {
		settings: getSettings( state ),
		getModule: slug => getModule( state, slug ),
		getModuleOverride: slug => getModuleOverride( state, slug ),
		isFound: slug => isModuleFound( state, slug ),
		isUpdating: setting => isUpdatingSetting( state, setting ),
		isUnavailableInOfflineMode: slug => isUnavailableInOfflineMode( state, slug ),
	} ),
	{ updateSettings }
)( CommentFeatures );
