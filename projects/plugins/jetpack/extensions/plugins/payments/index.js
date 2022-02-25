/**
 * External dependencies
 */
import { ExternalLink } from '@wordpress/components';
import { PluginPostPublishPanel } from '@wordpress/edit-post';
import { __ } from '@wordpress/i18n';

export const name = 'payments';
export const settings = {
	render: () => (
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
			<p>
				<ExternalLink href="https://wordpress.com/payments-donations/" target="_blank">
					{ __( 'Learn more about these blocks', 'jetpack' ) }
				</ExternalLink>
			</p>
		</PluginPostPublishPanel>
	),
};
