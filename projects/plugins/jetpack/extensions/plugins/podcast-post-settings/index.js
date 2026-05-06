import { select } from '@wordpress/data';
import { MicrophoneIcon } from './icons';
import PodcastSettingsSidebar from './sidebar';

export const name = 'podcast-post-settings';

const isPostEditor = () => select( 'core/editor' )?.getCurrentPostType() === 'post';

export const settings = {
	render: function PodcastPostSettingsPlugin() {
		if ( ! isPostEditor() ) {
			return null;
		}
		return <PodcastSettingsSidebar />;
	},
	icon: isPostEditor() ? <MicrophoneIcon /> : undefined,
};
