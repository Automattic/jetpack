/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

type Props = {
	onClick: () => void;
};

/**
 * wp-build dashboard button to open the integrations modal.
 *
 * @param props         - Props.
 * @param props.onClick - Click handler (typically opens a modal in the parent).
 * @return Button element.
 */
export default function ManageIntegrationsButton( { onClick }: Props ): JSX.Element {
	return (
		<Button size="compact" variant="secondary" onClick={ onClick }>
			{ __( 'Manage integrations', 'jetpack-forms' ) }
		</Button>
	);
}
