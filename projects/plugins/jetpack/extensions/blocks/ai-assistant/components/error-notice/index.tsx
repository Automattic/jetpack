/**
 * External dependencies
 */
import { Notice } from '@wordpress/components';
/**
 * Types
 */
import type React from 'react';

import './style.scss';

type ErrorNoticeProps = {
	/*
	 * The message to be showed on the Notice.
	 */
	message: string;

	/*
	 * The callback function to be called when the Notice is dismissed.
	 */
	onRemove: () => void;
};

/**
 * React component to render a notice with a message.
 *
 * @param {ErrorNoticeProps} props - The props for the component.
 * @returns {React.ReactElement } The Notice component.
 */
export default function ErrorNotice( { message, onRemove }: ErrorNoticeProps ): React.ReactElement {
	return (
		<Notice className="jetpack-ai-assistant__error-notice" status="warning" onRemove={ onRemove }>
			{ message }
		</Notice>
	);
}
