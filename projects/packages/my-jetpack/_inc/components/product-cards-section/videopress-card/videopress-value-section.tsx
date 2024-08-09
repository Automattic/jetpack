import type { FC } from 'react';

import './style.scss';

interface VideoPressValueSectionProps {
	isPluginActive: boolean;
	data: Window[ 'myJetpackInitialState' ][ 'videopress' ];
}

const VideoPressValueSection: FC< VideoPressValueSectionProps > = ( { isPluginActive, data } ) => {
	if ( ! isPluginActive && data.videoCount ) {
		return <span className="videopress-card__video-count">{ data.videoCount }</span>;
	}

	return null;
};

export default VideoPressValueSection;
