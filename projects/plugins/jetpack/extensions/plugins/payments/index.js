import { getRedirectUrl } from '@automattic/jetpack-components';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { useSelect } from '@wordpress/data';
import { PluginPostPublishPanel, store as editorStore } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { currencyDollar } from '@wordpress/icons';
import { Link } from '@wordpress/ui';

const PaymentsPostPublish = () => {
	const { tracks } = useAnalytics();
	const postType = useSelect( select => select( editorStore ).getCurrentPostType(), [] );

	if ( 'page' !== postType ) {
		return null;
	}

	const paymentInfoUrl = getRedirectUrl( 'wpcom-payments-donations' );
	const trackClick = () => {
		tracks.recordEvent( 'jetpack_editor_payments_post_publish_click' );
	};

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
				<Link openInNewTab href={ paymentInfoUrl } onClick={ trackClick }>
					{ __( 'Learn more about these blocks', 'jetpack' ) }
				</Link>
			</p>
		</PluginPostPublishPanel>
	);
};

export const name = 'payments';
export const settings = {
	render: PaymentsPostPublish,
};
