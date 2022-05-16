/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { queueMusic } from '../icons/';

export default {
	className: '',
	placeholderIcon: queueMusic,
	placeholderLabel: __( 'Podcast Player', 'jetpack' ),
	placeholderInstructions: __( 'Enter your podcast RSS feed URL.', 'jetpack' ),
};
