/**
 * External dependencies
 */
import { Button, Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import './index.scss';

type LearnHowModalProps = {
	onClose: () => void;
	isOpen: boolean;
};

/**
 * React component that renders the Learn How modal
 *
 * @param {LearnHowModalProps} props - Component properties.
 * @returns {object} Notice component
 */
export default function LearnHowModal( { isOpen, onClose }: LearnHowModalProps ) {
	if ( ! isOpen ) {
		return null;
	}

	return (
		<Modal
			title={ __( 'Chapters in VideoPress', 'jetpack-videopress-pkg' ) }
			isDismissible={ false }
			className="learn-how-modal"
			onRequestClose={ onClose }
		>
			<p>
				{ __(
					'Chapters are a great way to split up longer videos and organize them into different sections.',
					'jetpack-videopress-pkg'
				) }
			</p>
			<p>
				{ __(
					'They allow your visitors to see what each section is about and skip to their favorite parts.',
					'jetpack-videopress-pkg'
				) }
			</p>
			<p className="learn-how-modal__heading">
				{ __( 'How to add Chapters to your VideoPress videos', 'jetpack-videopress-pkg' ) }
			</p>
			<ol>
				<li>
					{ __(
						'In the Description, add a list of timestamps and titles.',
						'jetpack-videopress-pkg'
					) }
				</li>
				<li>
					{ __(
						'Make sure that the first timestamp starts with 00:00.',
						'jetpack-videopress-pkg'
					) }
				</li>
				<li>
					{ __(
						'Add at least three chapters entries and as many as you need.',
						'jetpack-videopress-pkg'
					) }
				</li>
				<li>
					{ __(
						'Add your chapters entries in consecutive order, with at least 10-second intervals between each.',
						'jetpack-videopress-pkg'
					) }
				</li>
			</ol>

			<p className="learn-how-modal__heading">{ __( 'Example', 'jetpack-videopress-pkg' ) }</p>

			<p>{ __( '00:00 Intro', 'jetpack-videopress-pkg' ) }</p>
			<p>{ __( '00:24 Mountains arise', 'jetpack-videopress-pkg' ) }</p>
			<p>{ __( '02:38 Coming back home', 'jetpack-videopress-pkg' ) }</p>
			<p>{ __( '03:04 Credits', 'jetpack-videopress-pkg' ) }</p>

			<div className="learn-how-modal__buttons">
				<Button className="learn-how-modal__button" onClick={ onClose } variant="primary">
					{ __( 'Got it, thanks', 'jetpack-videopress-pkg' ) }
				</Button>
			</div>
		</Modal>
	);
}
