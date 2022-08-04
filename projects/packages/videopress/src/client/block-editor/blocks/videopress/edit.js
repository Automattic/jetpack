import { useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import './editor.scss';

/**
 * VideoPress block Edit react component.
 *
 * @returns {object} Element to render.
 */
export default function VideoPressEdit() {
	return (
		<div { ...useBlockProps() }>
			{ __(
				'VideoPress – hello from the editor!',
				"no text domain is set in this in this project's .eslintrc.js"
			) }
		</div>
	);
}
