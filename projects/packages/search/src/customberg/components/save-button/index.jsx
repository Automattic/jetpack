import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import useEntityRecordState from 'hooks/use-entity-record-state';
import { eventPrefix, recordEvent } from 'lib/analytics';
import './styles.scss';

/**
 * Component for saving pending entity record changes.
 *
 * @return {Element} component instance
 */
export default function SaveButton() {
	const { isSaving, hasUnsavedEdits, saveRecords } = useEntityRecordState();

	const onClick = ( ...args ) => {
		if ( isSaving ) {
			return;
		}
		recordEvent( `${ eventPrefix }_save_button_click` );
		saveRecords( ...args );
	};

	return (
		<Button
			aria-disabled={ isSaving }
			className="jp-search-configure-save-button"
			disabled={ ! hasUnsavedEdits }
			isBusy={ isSaving }
			variant="primary"
			onClick={ onClick }
		>
			{ isSaving
				? __( 'Saving…', 'jetpack-search-pkg' )
				: __( 'Save', 'jetpack-search-pkg', /* dummy arg to avoid bad minification */ 0 ) }
		</Button>
	);
}
