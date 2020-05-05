/**
 * External dependencies
 */
import { get } from 'lodash';

export const isInstagramGalleryTokenConnected = ( state, token ) =>
	'connected' === get( state, [ 'tokens', token ] );

export const isInstagramGalleryTokenDisconnected = ( state, token ) =>
	'disconnected' === get( state, [ 'tokens', token ] );
