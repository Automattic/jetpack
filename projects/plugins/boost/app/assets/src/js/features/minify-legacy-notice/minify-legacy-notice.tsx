import { useDismissibleAlertState } from '$features/performance-history/lib/hooks';
import { recordBoostEvent } from '$lib/utils/analytics';
import { getRedirectUrl } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';

const MinifyLegacyNotice = () => {
	const [ isDismissed, dismissAlert ] = useDismissibleAlertState( 'legacy_minify_notice' );

	return (
		! isDismissed && (
			<Notice.Root intent="info">
				<Notice.Title>
					{ __( 'You are not taking full advantage of Concatenate JS or CSS', 'jetpack-boost' ) }
				</Notice.Title>
				<Notice.Description>
					<p>
						{ __(
							'You can improve the speed of concatenated files, and reduce the load on WordPress.',
							'jetpack-boost'
						) }
					</p>
				</Notice.Description>
				<Notice.Actions>
					<Notice.ActionLink
						href={ getRedirectUrl( 'jetpack-boost-minify-delivery' ) }
						target="_blank"
						rel="noreferrer"
						onClick={ () => {
							recordBoostEvent( 'critical_css_retry', {
								error_type: 'UnknownError',
							} );
						} }
					>
						{ __( 'Learn more', 'jetpack-boost' ) }
					</Notice.ActionLink>
				</Notice.Actions>
				<Notice.CloseIcon onClick={ dismissAlert } label={ __( 'Dismiss', 'jetpack-boost' ) } />
			</Notice.Root>
		)
	);
};

export default MinifyLegacyNotice;
