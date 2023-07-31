import { useRef, useCallback } from 'react';
import { showOdie } from '../showOdie';

const OdieWidget = () => {
	const widgetContainer = useRef( null );
	const handleButtonClick = useCallback( async () => {
		await showOdie( widgetContainer.current );
	}, [] );

	return (
		<div className="odie-widget__widget-container" ref={ widgetContainer }>
			<div className="odie-widget__widget-container"></div>
			<button className="odie-widget__button" onClick={ handleButtonClick }>
				Show Odie
			</button>
		</div>
	);
};

export default OdieWidget;
