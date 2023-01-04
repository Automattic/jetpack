import { getRedirectUrl } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { PluginPostPublishPanel } from '@wordpress/edit-post';
import { store as editorStore } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { currencyDollar } from '@wordpress/icons';
import analytics from '../../../_inc/client/lib/analytics';

const PaymentsPostPublish = () => {
	const paymentInfoUrl = getRedirectUrl( 'wpcom-payments-donations' );
	const trackClick = () => {
		analytics.tracks.recordEvent( 'jetpack_editor_payments_post_publish_click' );
	};
	const postType = useSelect( select => select( editorStore ).getCurrentPostType(), [] );

	if ( 'page' !== postType ) {
		return null;
	}

	return (
		<PluginPostPublishPanel
			className="jetpack-payments-post-publish-panel"
			title={ __( 'Start accepting payments', 'jetpack' ) }
			initialOpen
			icon={ currencyDollar }
		>
			<p>
				{ __( 'Insert the Payment Button or the Donations Form — no plugin required.', 'jetpack' ) }
			</p>
			<p>
				<ExternalLink href={ paymentInfoUrl } onClick={ trackClick }>
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
