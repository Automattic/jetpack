import { useSelect } from '@wordpress/data';
import { PluginPostPublishPanel, store as editorStore } from '@wordpress/editor';
import { store as socialStore } from '../../social-store';
import styles from './styles.module.scss';
import { useCompanionPlugin } from './use-companion-plugin';
import { CompanionPluginNotice } from '.';

/**
 * Post-publish panel inviting people who share to Bluesky or Mastodon to bring the replies back to their site.
 *
 * @return The panel, or null when there is nothing to offer.
 */
export function PostPublishCompanionPlugins() {
	const { isPostPublished, connections } = useSelect(
		select => ( {
			isPostPublished: select( editorStore ).isCurrentPostPublished(),
			connections: select( socialStore ).getConnections(),
		} ),
		[]
	);

	const bluesky = useCompanionPlugin( 'bluesky' );
	const mastodon = useCompanionPlugin( 'mastodon' );

	const services = [ bluesky, mastodon ]
		.filter(
			( { plugin, state } ) =>
				plugin &&
				state.status !== 'dismissed' &&
				connections?.some( ( { service_name } ) => service_name === plugin.service )
		)
		.map( ( { plugin } ) => plugin.service );

	if ( ! isPostPublished || ! services.length ) {
		return null;
	}

	return (
		<PluginPostPublishPanel>
			<div className={ styles.notices }>
				{ services.map( service => (
					<CompanionPluginNotice key={ service } serviceName={ service } context="post-publish" />
				) ) }
			</div>
		</PluginPostPublishPanel>
	);
}
