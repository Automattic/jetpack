import { MinimizedTourRendererProps } from '../types';
import type { Config } from '../types';
import type { FunctionComponent } from 'react';

interface Props extends MinimizedTourRendererProps {
	config: Config;
}

const TourKitMinimized: FunctionComponent< Props > = ( {
	config,
	steps,
	currentStepIndex,
	onMaximize,
	onDismiss,
} ) => {
	return (
		<div className="tour-kit-minimized">
			<config.renderers.tourMinimized
				steps={ steps }
				currentStepIndex={ currentStepIndex }
				onMaximize={ onMaximize }
				onDismiss={ onDismiss }
			/>
		</div>
	);
};

export default TourKitMinimized;
