import { PageActionButton } from '@automattic/jetpack-components/admin-page';
import { __ } from '@wordpress/i18n';
import { help } from '@wordpress/icons';

/**
 * Header control that opens the welcome guide again after it has been dismissed.
 *
 * @param props         - Component props.
 * @param props.onClick - Opens the guide.
 * @return The button.
 */
export default function ShowWelcomeGuideButton( { onClick }: { onClick: () => void } ) {
	return (
		<PageActionButton
			label={ __( 'Show welcome guide', 'jetpack-protect-pkg' ) }
			icon={ help }
			variant="minimal"
			size="compact"
			onClick={ onClick }
		/>
	);
}
