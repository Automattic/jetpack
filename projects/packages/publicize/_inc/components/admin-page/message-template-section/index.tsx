import { Text } from '@automattic/jetpack-components';
import { currentUserCan, siteHasFeature } from '@automattic/jetpack-script-data';
import { useDebounce } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as socialStore } from '../../../social-store';
import { features } from '../../../utils/constants';
import { MessageTemplateEditor } from '../../message-template-editor';
import styles from './styles.module.scss';

type MessageTemplateSectionProps = {
	/**
	 * Whether the section is disabled by an outer state (e.g. a save in flight elsewhere).
	 */
	disabled?: boolean;
};

const SAVE_DEBOUNCE_MS = 1000;

/**
 * Global message template editor section on the Social admin page.
 *
 * Renders inline within the SocialModuleToggle's grid (right column on wide
 * viewports) so it sits between the upgrade trigger and the connections
 * list without introducing a nested ToggleSection grid context. Visible
 * only when the site has the `social-message-templates` feature and the
 * user has `manage_options`.
 *
 * Auto-saves the textarea value via the WP `/wp/v2/settings` REST endpoint
 * after the user pauses typing.
 *
 * @param {MessageTemplateSectionProps} props - The component's props.
 * @return The rendered section, or `null` when gated out.
 */
export function MessageTemplateSection( props: MessageTemplateSectionProps ) {
	const { disabled } = props;
	const canManageOptions = currentUserCan( 'manage_options' );
	const featureEnabled = siteHasFeature( features.MESSAGE_TEMPLATES );

	const savedTemplate = useSelect(
		select => select( socialStore ).getSocialSettings().messageTemplate,
		[]
	);

	const { setMessageTemplate } = useDispatch( socialStore );

	const [ draft, setDraft ] = useState( savedTemplate );

	// Track the last value we sent to core. We only want to overwrite the
	// draft from `savedTemplate` when the saved value changes for a reason
	// other than our own in-flight save resolving — otherwise a slow save
	// can race with a still-typing user and clobber their edits.
	const lastSentRef = useRef( savedTemplate );

	useEffect( () => {
		if ( savedTemplate !== lastSentRef.current ) {
			setDraft( savedTemplate );
		}
	}, [ savedTemplate ] );

	const persist = useCallback(
		( value: string ) => {
			lastSentRef.current = value;
			setMessageTemplate( value );
		},
		[ setMessageTemplate ]
	);

	const debouncedSave = useDebounce( persist, SAVE_DEBOUNCE_MS );

	const handleChange = useCallback(
		( value: string ) => {
			setDraft( value );
			debouncedSave( value );
		},
		[ debouncedSave ]
	);

	if ( ! featureEnabled || ! canManageOptions ) {
		return null;
	}

	return (
		<div className={ styles.section }>
			<h4 className={ styles.title }>{ __( 'Default share message', 'jetpack-publicize-pkg' ) }</h4>
			<Text className={ styles.description }>
				{ __(
					'Set a default message format used when sharing posts to social networks. Use placeholders to insert post details automatically.',
					'jetpack-publicize-pkg'
				) }
			</Text>
			<MessageTemplateEditor value={ draft } onChange={ handleChange } disabled={ disabled } />
		</div>
	);
}
