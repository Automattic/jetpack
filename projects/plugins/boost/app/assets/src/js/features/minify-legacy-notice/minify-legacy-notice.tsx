import { useDismissibleAlertState } from '$features/performance-history/lib/hooks';
import { recordBoostEvent } from '$lib/utils/analytics';
import { getRedirectUrl, Notice } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';

const MinifyLegacyNotice = () => {
	const [ isDismissed, dismissAlert ] = useDismissibleAlertState( 'legacy_minify_notice' );

	return (
		! isDismissed && (
			<Notice
				title={ __(
					'You are not taking full advantage of Concatenate JS or CSS',
					'jetpack-boost'
				) }
				level="info"
				onClose={ dismissAlert }
			>
				<p>
					{ __(
						'You can improve the speed of concatenated files, and reduce the load on WordPress.',
						'jetpack-boost'
					) }
				</p>
				<p>
					<button
						className="secondary"
						onClick={ () => {
							recordBoostEvent( 'critical_css_retry', {
								error_type: 'UnknownError',
							} );

							const supportUrl = getRedirectUrl( 'jetpack-boost-minify-delivery' );
							window.open( supportUrl, '_blank' );
						} }
					>
						{ __( 'Learn more', 'jetpack-boost' ) }
					</button>
				</p>
			</Notice>
		)
	);
};

export default MinifyLegacyNotice;
