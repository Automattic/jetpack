import { Tooltip } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, lineSolid } from '@wordpress/icons';
import './style.scss';

/**
 * Render how empty field responses look like.
 *
 * @return {JSX.Element} Empty field response
 */
export default function EmptyResponse(): JSX.Element {
	return (
		<Tooltip text={ __( 'No response to this field.', 'jetpack-forms' ) }>
			<Icon icon={ lineSolid } className="jp-forms_empty-response" />
		</Tooltip>
	);
}
