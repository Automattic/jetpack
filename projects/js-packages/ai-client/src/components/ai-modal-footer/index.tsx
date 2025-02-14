/**
 * External dependencies
 */
import { Button } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, info } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import './style.scss';
/**
 * Types
 */
import type React from 'react';

type AiModalFooterProps = {
	onGuidelinesClick?: () => void;
	onFeedbackClick?: () => void;
};

/**
 * AiModalFooter component.
 *
 * @param {AiModalFooterProps} props - component props.
 * @return {React.ReactElement} - rendered component.
 */
export default function AiModalFooter( {
	onGuidelinesClick,
	onFeedbackClick,
}: AiModalFooterProps ): React.ReactElement {
	const handleGuidelinesClick = useCallback( () => {
		onGuidelinesClick?.();
	}, [ onGuidelinesClick ] );

	const handleFeedbackClick = useCallback( () => {
		onFeedbackClick?.();
	}, [ onFeedbackClick ] );

	return (
		<>
			<div className="ai-image-modal__footer-disclaimer">
				<Icon icon={ info } />
				<span>
					{ __(
						'Generated images could be inaccurate, biased or include text.',
						'jetpack-ai-client'
					) }
				</span>
				<Button
					variant="link"
					className="ai-image-modal__guidelines-button"
					href="https://jetpack.com/redirect/?source=ai-guidelines"
					target="_blank"
					onClick={ handleGuidelinesClick }
				>
					<span>{ __( 'Guidelines', 'jetpack-ai-client' ) } ↗</span>
				</Button>
			</div>
			<Button
				variant="link"
				className="ai-image-modal__feedback-button"
				href="https://jetpack.com/redirect/?source=jetpack-ai-feedback"
				target="_blank"
				onClick={ handleFeedbackClick }
			>
				<span>{ __( 'Give feedback', 'jetpack-ai-client' ) } ↗</span>
			</Button>
		</>
	);
}
