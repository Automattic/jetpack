import { __ } from '@wordpress/i18n';

export function EmptyAutomation(): JSX.Element {
	return (
		<div className="mailpoet-automation-editor-empty-automation">
			{ __( 'No automation data.', 'mailpoet' ) }
		</div>
	);
}
