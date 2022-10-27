/**
 * External dependencies
 */
import { addFilter } from '@wordpress/hooks';
/**
 * Internal dependencies
 */
import './blocks/video';
/*
 * Plugins
 */
import addVideoPressVideoChaptersSupport from './plugins/video-chapters';

/*
 * Extensibility
 */
import './extend';

/*
 * Extensions
 */
import './extensions';

addFilter(
	'blocks.registerBlockType',
	'videopress/add-wp-chapters-support',
	addVideoPressVideoChaptersSupport
);
