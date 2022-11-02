/**
 * External dependencies
 */
import { Notice, Button } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useState } from 'react';
/**
 * Internal dependencies
 */
import './index.scss';

/**
 * React component that renders a Notice with some specific design changes
 *
 * @returns {object} Notice component
 */
export default function LearnHowNotice() {
	const [ dismiss, setDismiss ] = useState( false );

	const onRemove = () => {
		setDismiss( true );
	};

	const message = createInterpolateElement(
		__(
			'Did you know you can now <addChapters>add Chapters</addChapters> to your videos?',
			'jetpack-videopress-pkg'
		),
		{
			addChapters: <span className="add-chapters-message" />,
		}
	);

	if ( dismiss ) {
		return null;
	}

	return (
		<Notice status="info" className="learn-how-notice" onRemove={ onRemove }>
			<p className="message">{ message }</p>
			<Button href="true" className="learn-how-button" onClick={ () => {} }>
				{ __( 'Learn how', 'jetpack-videopress-pkg' ) }
			</Button>
		</Notice>
	);
}
