import { siteHasFeature } from '@automattic/jetpack-script-data';
import { useDebounce } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as socialStore } from '../../../social-store';
import { Connection } from '../../../social-store/types';
import { features } from '../../../utils/constants';
import { MessageTemplateEditor } from '../../message-template-editor';
import styles from './style.module.scss';

type ConnectionTemplateEditorProps = {
	connection: Connection;
};

const SAVE_DEBOUNCE_MS = 1000;

const PLACEHOLDER_TEXT = __(
	'Leave empty to use the default share message.',
	'jetpack-publicize-pkg'
);

const HELP_TEXT = __(
	'Posts shared to this account will use this template instead of the default.',
	'jetpack-publicize-pkg'
);

/**
 * Per-connection message template editor.
 *
 * Renders only when the site has the `social-message-templates` feature
 * AND the `social-enhanced-publishing` paid plan, AND the user can manage
 * the connection. Auto-saves through `updateConnectionById` after the user
 * pauses typing.
 *
 * @param {ConnectionTemplateEditorProps} props - The component's props.
 * @return The rendered editor, or `null` when gated out.
 */
export function ConnectionTemplateEditor( props: ConnectionTemplateEditorProps ) {
	const { connection } = props;

	const featureEnabled = siteHasFeature( features.MESSAGE_TEMPLATES );
	const planEnabled = siteHasFeature( features.ENHANCED_PUBLISHING );

	const canManageConnection = useSelect(
		select => select( socialStore ).canUserManageConnection( connection ),
		[ connection ]
	);

	const savedTemplate = connection.template ?? '';

	const [ draft, setDraft ] = useState( savedTemplate );

	// Track the last value we sent so we can skip the useEffect re-sync when
	// the saved value comes back equal to what our own save just persisted —
	// otherwise a slow save can race with a still-typing user and clobber
	// their edits.
	const lastSentRef = useRef( savedTemplate );

	useEffect( () => {
		if ( savedTemplate !== lastSentRef.current ) {
			setDraft( savedTemplate );
		}
	}, [ savedTemplate ] );

	const { updateConnectionById } = useDispatch( socialStore );

	const persist = useCallback(
		( value: string ) => {
			lastSentRef.current = value;
			updateConnectionById( connection.connection_id, { template: value }, { silent: true } );
		},
		[ connection.connection_id, updateConnectionById ]
	);

	const debouncedSave = useDebounce( persist, SAVE_DEBOUNCE_MS );

	const handleChange = useCallback(
		( value: string ) => {
			setDraft( value );
			debouncedSave( value );
		},
		[ debouncedSave ]
	);

	if ( ! featureEnabled || ! planEnabled || ! canManageConnection ) {
		return null;
	}

	return (
		<div className={ styles.editor }>
			<MessageTemplateEditor
				label={ __( 'Custom message for this connection', 'jetpack-publicize-pkg' ) }
				placeholder={ PLACEHOLDER_TEXT }
				helpText={ HELP_TEXT }
				value={ draft }
				onChange={ handleChange }
				rows={ 3 }
			/>
		</div>
	);
}
