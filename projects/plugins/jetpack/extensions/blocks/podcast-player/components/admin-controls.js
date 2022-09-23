import { memo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { fetchPodcastFeed } from '../api';

const AdminControls = memo( ( { canUserRefreshPodcast, url } ) => {
	if ( ! canUserRefreshPodcast || ! url ) {
		return null;
	}

	const triggerPodcastRefresh = () => {
		fetchPodcastFeed( { url, forceRefresh: true } ).then( () => document.location.reload() );
	};

	return (
		<div className="jetpack-podcast-player__admin-controls">
			<span className="jetpack-podcast-player__admin-refresh-message">
				{ __( "Visitors to your site can't see this option.", 'jetpack' ) }
			</span>
			<input
				type="button"
				className="jetpack-podcast-player__refresh-podcast-button wp-element-button button"
				onClick={ triggerPodcastRefresh }
				value={ __( 'Refresh podcast', 'jetpack' ) }
			/>
		</div>
	);
} );

export default AdminControls;
