/**
 * External dependencies
 */
import { BlockIcon } from '@wordpress/block-editor';
import { Placeholder, withNotices } from '@wordpress/components';
import { createInterpolateElement, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { share as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import './editor.scss';

function SharingButtonsEdit({ attributes, className, noticeOperations, noticeUI, setAttributes }) {
	/**
	 * Write the block editor UI.
	 *
	 * @returns {object} The UI displayed when user edits this block.
	 */
	const [notice, setNotice] = useState();

	/* Call this function when you want to show an error in the placeholder. */
	const setErrorNotice = () => {
		noticeOperations.removeAllNotices();
		noticeOperations.createErrorNotice(__('Put error message here.', 'jetpack'));
	};

	return (
		<div className={className}>
			<Placeholder
				label={__('Sharing Buttons', 'jetpack')}
				instructions={<Instructions />}
				icon={<BlockIcon icon={icon} />}
				notices={noticeUI}
			></Placeholder>
		</div>
	);
}

function Instructions() {
	return createInterpolateElement(
		__('Customize your sharing settings via <a>Jetpack Sharing Settings</a>', 'jetpack'),
		{
			a: <a href="/wp-admin/admin.php?page=jetpack#/sharing" target="_blank" />,
		}
	);
}

export default SharingButtonsEdit;
