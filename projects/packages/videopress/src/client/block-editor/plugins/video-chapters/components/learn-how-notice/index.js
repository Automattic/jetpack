/**
 * External dependencies
 */
import { Notice, Button, Modal } from '@wordpress/components';
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
	const [ showModal, setShowModal ] = useState( false );

	const onRemove = () => {
		setDismiss( true );
	};

	const openModal = () => {
		setShowModal( true );
	};

	const closeModal = () => {
		setShowModal( false );
	};

	const message = createInterpolateElement(
		__(
			'Did you know you can now <addChapters>add Chapters</addChapters> to your videos?',
			'jetpack-videopress-pkg'
		),
		{
			addChapters: <span className="learn-how-notice__add-chapters-message" />,
		}
	);

	if ( dismiss ) {
		return null;
	}

	return (
		<>
			<Notice status="info" className="learn-how-notice" onRemove={ onRemove }>
				<p className="learn-how-notice__message">{ message }</p>
				<Button className="learn-how-notice__button" onClick={ openModal } variant="link">
					{ __( 'Learn how', 'jetpack-videopress-pkg' ) }
				</Button>
			</Notice>
			{ showModal && (
				<Modal
					title={ __( 'Chapters in VideoPress', 'jetpack-videopress-pkg' ) }
					isDismissible={ false }
					className="learn-how-modal"
				>
					<p className="learn-how-modal__heading">
						{ __( 'How to add Chapters to your VideoPress videos', 'jetpack-videopress-pkg' ) }
					</p>
					<p>
						{ __(
							'1. In the Description, add a list of timestamps and titles.',
							'jetpack-videopress-pkg'
						) }
					</p>
					<p>
						{ __(
							'2. Make sure that the first timestamp you list starts with 00:00.',
							'jetpack-videopress-pkg'
						) }
					</p>
					<p>
						{ __(
							'3. Your video should have at least three timestamps listed in ascending order.',
							'jetpack-videopress-pkg'
						) }
					</p>

					<p className="learn-how-modal__heading">
						{ __( 'How to add Chapters to your VideoPress videos', 'jetpack-videopress-pkg' ) }
					</p>
					<p>{ __( '00:00 Intro', 'jetpack-videopress-pkg' ) }</p>
					<p>{ __( '00:24 Mountains arise', 'jetpack-videopress-pkg' ) }</p>
					<p>{ __( '02:38 Coming back home', 'jetpack-videopress-pkg' ) }</p>
					<p>{ __( '03:04 Credits', 'jetpack-videopress-pkg' ) }</p>

					<Button className="learn-how-modal__button" onClick={ closeModal } variant="primary">
						{ __( 'Got it, thanks', 'jetpack-videopress-pkg' ) }
					</Button>
				</Modal>
			) }
		</>
	);
}
