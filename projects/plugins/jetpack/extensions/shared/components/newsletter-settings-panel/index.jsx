import { getAdminUrl } from '@automattic/jetpack-script-data';
import { ExternalLink, Notice, PanelBody, ToggleControl } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Panel for blocks or template parts placed by a Newsletter settings option.
 *
 * Renders nothing when the site settings can't be read, which limits it to site administrators.
 *
 * @param {object}   props        - Component props; any others are passed to the panel component.
 * @param {string}   props.option - Placement option name, e.g. `sm_enabled`.
 * @param {string}   props.label  - Toggle label.
 * @param {Function} [props.as]   - Panel component, e.g. `PluginDocumentSettingPanel`. Defaults to `PanelBody`.
 * @return {Element|null} The panel.
 */
export default function NewsletterSettingsPanel( {
	option,
	label,
	as: Panel = PanelBody,
	...panelProps
} ) {
	const enabled = useSelect(
		select => select( coreStore ).getEntityRecord( 'root', 'site' )?.[ option ],
		[ option ]
	);
	const { saveEntityRecord } = useDispatch( coreStore );
	const [ savingValue, setSavingValue ] = useState( null );
	const [ hasError, setHasError ] = useState( false );

	if ( enabled === undefined ) {
		return null;
	}

	const isSaving = savingValue !== null;

	const onChange = async value => {
		setSavingValue( value );
		setHasError( false );

		try {
			await saveEntityRecord( 'root', 'site', { [ option ]: value }, { throwOnError: true } );
		} catch {
			setHasError( true );
		} finally {
			setSavingValue( null );
		}
	};

	return (
		<Panel title={ __( 'Added by Newsletter settings', 'jetpack' ) } { ...panelProps }>
			{ hasError && (
				<Notice status="error" onRemove={ () => setHasError( false ) }>
					{ __( 'Your Newsletter settings couldn’t be saved. Please try again.', 'jetpack' ) }
				</Notice>
			) }
			<ToggleControl
				label={ label }
				checked={ isSaving ? savingValue : !! enabled }
				disabled={ isSaving }
				onChange={ onChange }
			/>
			<p style={ { marginTop: '16px' } }>
				<ExternalLink
					href={ getAdminUrl( 'admin.php?page=jetpack-newsletter&p=%2F%3Ftab%3Dsettings' ) }
				>
					{ __( 'Manage Newsletter settings', 'jetpack' ) }
				</ExternalLink>
			</p>
		</Panel>
	);
}
