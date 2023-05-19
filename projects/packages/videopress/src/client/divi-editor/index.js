// External Dependencies
import $ from 'jquery';
// Internal Dependencies
import modules from './modules';

$( window ).on( 'et_builder_api_ready', ( _, API ) => {
	API.registerModules( modules );
} );
