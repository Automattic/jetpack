/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { download } from '@wordpress/icons';

type Props = {
	isPrimary?: boolean;
	onClick?: () => void;
};

/**
 * wp-build dashboard export button (placeholder).
 *
 * Note: wp-build does not yet use the full export flow/modal from the old dashboard.
 *
 * @param props           - Props.
 * @param props.isPrimary - Whether the button should be primary.
 * @param props.onClick   - Optional click handler.
 * @return Button element.
 */
export default function ExportResponsesButton( {
	isPrimary = false,
	onClick,
}: Props ): JSX.Element {
	return (
		<Button
			size="compact"
			variant={ isPrimary ? 'primary' : 'secondary' }
			icon={ download }
			onClick={ onClick }
		>
			{ __( 'Export', 'jetpack-forms' ) }
		</Button>
	);
}
