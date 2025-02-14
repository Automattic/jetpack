import { useDismissibleAlertState } from '$features/performance-history/lib/hooks';
import { Notice } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';

const LegacyMinifyNotice = () => {
	const [ isDismissed, dismissAlert ] = useDismissibleAlertState( 'static_minification_notice' );

	return (
		! isDismissed && (
			<Notice level="info" onClose={ dismissAlert }>
				{ __(
					'You are using the legacy cache delivery method for concatenated files. Learn more.',
					'jetpack-boost'
				) }
			</Notice>
		)
	);
};

export default LegacyMinifyNotice;
