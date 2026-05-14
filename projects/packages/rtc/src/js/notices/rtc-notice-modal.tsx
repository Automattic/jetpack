/**
 * RTC Notice Modal
 *
 * A generalized modal component for real-time collaboration notices.
 * Used across different RTC notice scenarios (upgrade, blocked, etc.).
 */

import { Button, Modal } from '@wordpress/components';
import { useEffect, useRef } from '@wordpress/element';
import clsx from 'clsx';
import RtcHeaderIllustration from './rtc-header-illustration';
import './rtc-notice-modal.scss';
import type { FC, ReactNode } from 'react';

interface RtcNoticeAction {
	/** Button label */
	label: string;
	/** Click handler */
	onClick: () => void;
	/** Button variant - defaults to 'primary' */
	variant?: 'primary' | 'secondary' | 'tertiary' | 'link';
}

interface RtcNoticeModalProps {
	/** Whether the modal is open */
	isOpen: boolean;
	/** Modal title */
	title: string;
	/** Modal description / body text */
	description: string | ReactNode;
	/** Primary action button */
	primaryAction: RtcNoticeAction;
	/** Optional secondary action (rendered as a link below the primary button) */
	secondaryAction?: RtcNoticeAction;
	/** Handler for closing the modal (X button or overlay click) */
	onRequestClose: () => void;
	/** Optional callback when modal opens */
	onOpen?: () => void;
	/** Optional extra CSS class */
	className?: string;
	/** Whether the modal shows the X close button. Defaults to true. */
	isDismissible?: boolean;
	/** Whether clicking outside closes the modal. Defaults to true. */
	shouldCloseOnClickOutside?: boolean;
}

const RtcNoticeModal: FC< RtcNoticeModalProps > = ( {
	isOpen,
	title,
	description,
	primaryAction,
	secondaryAction,
	onRequestClose,
	onOpen,
	className,
	isDismissible = true,
	shouldCloseOnClickOutside = true,
} ) => {
	const prevIsOpen = useRef< boolean | null >( null );

	useEffect( () => {
		if ( ! prevIsOpen.current && isOpen ) {
			onOpen?.();
		}
		prevIsOpen.current = isOpen;
	}, [ prevIsOpen, isOpen, onOpen ] );

	if ( ! isOpen ) {
		return null;
	}

	return (
		<Modal
			className={ clsx( 'rtc-notice-modal', className ) }
			title=""
			onRequestClose={ onRequestClose }
			isDismissible={ isDismissible }
			shouldCloseOnClickOutside={ shouldCloseOnClickOutside }
		>
			<div className="rtc-notice-modal__header">
				<RtcHeaderIllustration />
			</div>
			<div className="rtc-notice-modal__body">
				<h1 className="rtc-notice-modal__title">{ title }</h1>
				<p className="rtc-notice-modal__description">{ description }</p>
				<div className="rtc-notice-modal__actions">
					<Button
						variant={ primaryAction.variant || 'primary' }
						className="rtc-notice-modal__primary-action"
						onClick={ primaryAction.onClick }
					>
						{ primaryAction.label }
					</Button>
					{ secondaryAction && (
						<Button
							variant={ secondaryAction.variant || 'link' }
							className="rtc-notice-modal__secondary-action"
							onClick={ secondaryAction.onClick }
						>
							{ secondaryAction.label }
						</Button>
					) }
				</div>
			</div>
		</Modal>
	);
};

export default RtcNoticeModal;
export type { RtcNoticeAction, RtcNoticeModalProps };
