import { Button, Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { useReducer } from 'react';
import { useLinkPreviewPostData } from '../../hooks/use-link-preview-post-data';
import styles from './styles.module.scss';
import { LinkPreviewTabs } from './tabs';
import { LinkPreviewData, LinkPreviewPlatform } from './types';

export type LinkPreviewModalProps = Omit< React.ComponentProps< typeof Modal >, 'children' > & {
	/**
	 * The data to show in the link preview modal.
	 */
	previewData?: Partial< LinkPreviewData >;

	/**
	 * The initial tab to show when the modal opens.
	 */
	initialTabName?: LinkPreviewPlatform;
};

/**
 * The link preview modal component.
 * @param {LinkPreviewModalProps} props - The props for the link preview modal.
 * @return The link preview modal component.
 */
export function LinkPreviewModal( {
	previewData,
	initialTabName,
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
			<LinkPreviewTabs
				initialTabName={ initialTabName }
				{ ...linkPreviewData }
				{ ...previewData }
			/>
		</Modal>
	);
}

export type LinkPreviewModalWithTriggerProps = Partial< LinkPreviewModalProps > & {
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
