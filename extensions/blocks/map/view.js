/**
 * External dependencies
 */
import domReady from '@wordpress/dom-ready';

/**
 * Internal dependencies
 */
import './style.scss';
import component from './component.js';
import { settings } from './settings.js';
import FrontendManagement from '../../shared/frontend-management.js';
import { getActiveStyleName } from '../../shared/block-styles';

domReady( function () {
	const frontendManagement = new FrontendManagement();
	// Add apiKey to attibutes so FrontendManagement knows about it.
	// It is dynamically being added on the php side.
	// So that it can be updated across all the map blocks at the same time.
	const apiKey = {
		type: 'string',
		default: '',
	};
	frontendManagement.blockIterator( document, [
		{
			component: component,
			options: {
				settings: {
					...settings,
					attributes: {
						...settings.attributes,
						mapStyle: getActiveStyleName( settings.styles, settings.className ),
						apiKey,
					},
				},
			},
		},
	] );
} );
