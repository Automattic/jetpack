/**
 * External dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * VideoPress blok save function
 *
 * @returns {object} Element to render.
 */
export default function save() {
	return (
		<p { ...useBlockProps.save() }>
			{ __(
				'VideoPress – hello from the saved content!',
				"no text domain is set in this in this project's .eslintrc.js"
			) }
		</p>
	);
}
