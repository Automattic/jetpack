/**
 * External dependencies
 */
import { ExternalLink } from '@wordpress/components';
import { PluginPostPublishPanel } from '@wordpress/edit-post';
import { currencyDollar } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import analytics from '../../../_inc/client/lib/analytics';
import useAutosaveAndRedirect from '../../shared/use-autosave-and-redirect/index';

const PaymentsPostPublish = () => {
	const paymentInfoUrl = 'https://wordpress.com/payments-donations/';
	const { autosaveAndRedirect } = useAutosaveAndRedirect( paymentInfoUrl );
	const trackClick = event => {
		event.preventDefault();
		analytics.tracks.recordEvent( 'jetpack_editor_payments_post_publish_click' );
		autosaveAndRedirect( event, true );
	};

	return (
		<PluginPostPublishPanel
			className="jetpack-payments-post-publish-panel"
			title={ __( 'Start accepting payments', 'jetpack' ) }
			initialOpen
			icon={ currencyDollar }
		>
			<p>
				{ __(
					'Insert the Payments block button or the Donations block form — no plugin required.',
					'jetpack'
				) }
			</p>
			<p>
				<ExternalLink
					href="https://wordpress.com/payments-donations/"
					target="_blank"
					onClick={ trackClick }
				>
					{ __( 'Learn more about these blocks', 'jetpack' ) }
				</ExternalLink>
			</p>
		</PluginPostPublishPanel>
	);
};

export const name = 'payments';
export const settings = {
	render: PaymentsPostPublish,
};
