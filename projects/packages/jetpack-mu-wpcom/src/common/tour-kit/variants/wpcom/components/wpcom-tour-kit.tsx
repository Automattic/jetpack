import TourKit from '../../../components/tour-kit';
import usePrefetchTourAssets from '../hooks/use-prefetch-tour-assets';
import WpcomTourKitMinimized from './wpcom-tour-kit-minimized';
import WpcomTourKitStep from './wpcom-tour-kit-step';
import '../styles.scss';
import type { WpcomConfig, TourStepRenderer } from '../../../types';
import type { FunctionComponent } from 'react';

interface Props {
	config: WpcomConfig;
}

const WpcomTourKit: FunctionComponent< Props > = ( { config } ) => {
	usePrefetchTourAssets( config.steps );

	return (
		<TourKit
			__temp__className="wpcom-tour-kit"
			config={ {
				...config,
				renderers: {
					tourStep: WpcomTourKitStep as TourStepRenderer,
					tourMinimized: WpcomTourKitMinimized,
				},
			} }
		/>
	);
};

export default WpcomTourKit;
