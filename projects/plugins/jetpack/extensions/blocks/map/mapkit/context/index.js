import { createContext } from '@wordpress/element';

const MapkitContext = createContext( {
	map: null,
	mapkit: null,
	loaded: false,
} );

const MapkitProvider = MapkitContext.Provider;

export { MapkitContext, MapkitProvider };
