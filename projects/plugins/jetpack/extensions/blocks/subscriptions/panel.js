/**
 * External dependencies
 */
import { PluginPrePublishPanel, PluginPostPublishPanel } from '@wordpress/edit-post';
import { createInterpolateElement, useEffect, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getSubscriberCount } from './api';
import InspectorNotice from '../../shared/components/inspector-notice';
import './panel.scss';

export default function SubscribePanels() {
	const [ subscriberCount, setSubscriberCount ] = useState( null );
	useEffect( () => {
		getSubscriberCount( count => setSubscriberCount( count ) );
	}, [] );

	return ! Number.isFinite( subscriberCount ) || subscriberCount <= 0 ? null : (
		<>
			<PluginPrePublishPanel
				className="jetpack-subscribe-pre-publish-panel"
				initialOpen
				title={ __( 'Subscribers', 'jetpack' ) }
			>
				<InspectorNotice>
					{ createInterpolateElement(
						sprintf(
							/* translators: %s is the number of subscribers */
							_n(
								'This post will be sent to <span>%s reader</span>',
								'This post will be sent to <span>%s readers</span>',
								subscriberCount,
								'jetpack'
							),
							subscriberCount
						),
						{ span: <span className="jetpack-subscribe-reader-count" /> }
					) }
				</InspectorNotice>
			</PluginPrePublishPanel>
			<PluginPostPublishPanel className="jetpack-subscribe-post-publish-panel" initialOpen>
				<InspectorNotice>
					{ createInterpolateElement(
						sprintf(
							/* translators: %s is the number of subscribers */
							_n(
								'This post has been sent to <span>%s reader</span>',
								'This post has been sent to <span>%s readers</span>',
								subscriberCount,
								'jetpack'
							),
							subscriberCount
						),
						{ span: <span className="jetpack-subscribe-reader-count" /> }
					) }
				</InspectorNotice>
			</PluginPostPublishPanel>
		</>
	);
}
