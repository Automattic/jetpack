import { getBlockIconComponent } from '@automattic/jetpack-shared-extension-utils';
import { BlockIcon } from '@wordpress/block-editor';
import { Placeholder, withNotices } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import metadata from './block.json';
import './editor.scss';

const icon = getBlockIconComponent( metadata );

function SubscriberLoginEdit( {
	attributes,
	className,
	noticeOperations,
	noticeUI,
	setAttributes,
} ) {
	/**
	 * Write the block editor UI.
	 *
	 * @returns {object} The UI displayed when user edits this block.
	 */
	const [ notice, setNotice ] = useState();

	/* Call this function when you want to show an error in the placeholder. */
	const setErrorNotice = () => {
		noticeOperations.removeAllNotices();
		noticeOperations.createErrorNotice( __( 'Put error message here.', 'jetpack' ) );
	};

	return (
		<div>
			<a href="#">{ __( 'Log out', 'jetpack' ) }</a>
		</div>
	);
}

export default SubscriberLoginEdit;
