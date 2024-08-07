import type { FC } from 'react';

import './style.scss';

interface VideoPressValueSectionProps {
	isPluginActive: boolean;
	data: Window[ 'myJetpackInitialState' ][ 'videopress' ];
}

const VideoPressValueSection: FC< VideoPressValueSectionProps > = ( { isPluginActive, data } ) => {
	if ( ! isPluginActive && data.videoCount ) {
		return (
			<div className="videopress-card__video-count">
				<span>{ data.videoCount }</span>
			</div>
		);
	}

	return null;
};

export default VideoPressValueSection;
