import { Button, Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { useReducer } from 'react';
import { useLinkPreviewPostData } from '../../hooks/use-link-preview-post-data';
import styles from './styles.module.scss';
import { LinkPreviewTabs } from './tabs';
import { LinkPreviewData } from './types';

export type LinkPreviewModalProps = React.ComponentProps< typeof Modal > & {
	/**
	 * The data to show in the link preview modal.
	 */
	previewData?: Partial< LinkPreviewData >;
};

/**
 * The link preview modal component.
 * @param {LinkPreviewModalProps} props - The props for the link preview modal.
 * @return The link preview modal component.
 */
export function LinkPreviewModal( {
	previewData,
	title,
	className,
	...modalProps
}: LinkPreviewModalProps ) {
	const linkPreviewData = useLinkPreviewPostData();

	return (
		<Modal
			title={ title || __( 'Previews', 'jetpack-publicize-pkg' ) }
			size="fill"
			className={ clsx( styles[ 'link-preview-modal' ], className ) }
			{ ...modalProps }
		>
			<LinkPreviewTabs { ...linkPreviewData } { ...previewData } />
		</Modal>
	);
}

export type LinkPreviewModalWithTriggerProps = LinkPreviewModalProps & {
	/**
	 * The text to show in the trigger button that opens the modal.
	 */
	triggerButtonProps?: React.ComponentProps< typeof Button >;
};

/**
 * The link preview modal component with a trigger button to open the modal.
 *
 * @param {LinkPreviewModalWithTriggerProps} props - The props for the link preview modal with trigger.
 * @return The link preview modal component with trigger.
 */
export function LinkPreviewModalWithTrigger( {
	triggerButtonProps,
	...modalProps
}: LinkPreviewModalWithTriggerProps ) {
	const [ isOpen, toggle ] = useReducer( state => ! state, false );

	return (
		<>
			<Button variant="secondary" size="compact" { ...triggerButtonProps } onClick={ toggle }>
				{ triggerButtonProps?.children || __( 'View previews', 'jetpack-publicize-pkg' ) }
			</Button>
			{ isOpen && <LinkPreviewModal { ...modalProps } onRequestClose={ toggle } /> }
		</>
	);
}
