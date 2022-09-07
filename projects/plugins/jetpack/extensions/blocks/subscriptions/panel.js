import { JetpackIcon, numberFormat } from '@automattic/jetpack-components';
import { isComingSoon, isPrivateSite } from '@automattic/jetpack-shared-extension-utils';
import { useSelect } from '@wordpress/data';
import { PluginPrePublishPanel, PluginPostPublishPanel } from '@wordpress/edit-post';
import { store as editorStore } from '@wordpress/editor';
import { createInterpolateElement, useEffect, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import InspectorNotice from '../../shared/components/inspector-notice';
import { getSubscriberCount } from './api';
import './panel.scss';

export default function SubscribePanels() {
	const [ subscriberCount, setSubscriberCount ] = useState( null );
	useEffect( () => {
		getSubscriberCount( count => setSubscriberCount( count ) );
	}, [] );

	// Only show this for posts for now (subscriptions are only available on posts).
	const postType = useSelect( select => select( editorStore ).getCurrentPostType(), [] );
	if ( 'post' !== postType ) {
		return null;
	}

	// Subscriptions will not be triggered on private sites (on WordPress.com simple and WoA),
	// nor on sites that have not been launched yet.
	if ( isPrivateSite() || isComingSoon() ) {
		return null;
	}

	// Do not show any panels when we have no info about the subscriber count, or it is too low.
	if ( ! Number.isFinite( subscriberCount ) || subscriberCount <= 0 ) {
		return null;
	}

	return (
		<>
			<PluginPrePublishPanel
				className="jetpack-subscribe-pre-publish-panel"
				initialOpen
				title={ __( 'Subscribers', 'jetpack' ) }
				icon={ <JetpackIcon /> }
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
							numberFormat( subscriberCount )
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
							numberFormat( subscriberCount )
						),
						{ span: <span className="jetpack-subscribe-reader-count" /> }
					) }
				</InspectorNotice>
			</PluginPostPublishPanel>
		</>
	);
}
