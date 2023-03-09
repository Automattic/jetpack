import { createContext, useState } from '@wordpress/element';

const MapkitContext = createContext( {
	map: null,
	mapkit: null,
	loaded: false,
	activeMarker: null,
	calloutReference: null,
	currentDoc: null,
	currentWindow: null,
	admin: false,
	setPoints: () => {},
	points: [],
	previousCenter: null,
} );

const MapkitProvider = ( { value, children } ) => {
	const [ activeMarker, setActiveMarker ] = useState( null );
	const [ calloutReference, setCalloutReference ] = useState( null );
	const [ previousCenter, setPreviousCenter ] = useState( null );
	return (
		<MapkitContext.Provider
			value={ {
				...value,
				activeMarker,
				setActiveMarker,
				calloutReference,
				setCalloutReference,
				previousCenter,
				setPreviousCenter,
			} }
		>
			{ children }
		</MapkitContext.Provider>
	);
};

export { MapkitContext, MapkitProvider };
