/**
 * External dependencies
 */
import { Button } from '@wordpress/components';
import { PluginPostPublishPanel } from '@wordpress/edit-post';
import { useCallback } from '@wordpress/element';
import { external, Icon } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import analytics from '../../../_inc/client/lib/analytics';

/**
 * Style dependencies
 */
import './editor.scss';

const PaymentsPostPublish = () => {
	const trackClick = useCallback(
		() => analytics.tracks.recordEvent( 'jetpack_editor_payments_post_publish_click' ),
		[]
	);
	return (
		<PluginPostPublishPanel className="jetpack-payments-post-publish-panel" initialOpen>
			<p className="post-publish-panel__postpublish-subheader">
				<strong>{ __( 'Start accepting payments', 'jetpack' ) }</strong>
			</p>
			<p>
				{ __(
					'Insert the Payments block button or the Donations block form -- no plugin required.',
					'jetpack'
				) }
			</p>
			<div
				role="link"
				className="post-publish-panel__postpublish-buttons"
				tabIndex={ 0 }
				onClick={ trackClick }
				onKeyDown={ trackClick }
			>
				<Button isPrimary href="https://wordpress.com/payments-donations/" target="_top">
					{ __( 'Learn more about these blocks', 'jetpack' ) }{ ' ' }
					<Icon icon={ external } className="payments-post-publish-outbound-link__external_icon" />
				</Button>
			</div>
		</PluginPostPublishPanel>
	);
};

export const name = 'payments';
export const settings = {
	render: PaymentsPostPublish,
};
