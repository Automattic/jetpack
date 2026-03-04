import { useBlockEditingMode, useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { Disabled, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { navigateToForm } from '../util/navigate-to-form.ts';
import ContactFormSkeletonLoader from './jetpack-contact-form-skeleton-loader.js';
import './widget-editor-readonly-view.scss';

export default function WidgetEditorReadonlyView( {
	blockProps,
	innerBlocksProps,
	isResolvingSyncedForm,
	formRef,
	flushPendingSave,
}: {
	blockProps: ReturnType< typeof useBlockProps >;
	innerBlocksProps: ReturnType< typeof useInnerBlocksProps >;
	isResolvingSyncedForm: boolean;
	formRef: number;
	flushPendingSave: () => void;
} ) {
	useBlockEditingMode( 'contentOnly' );

	const handleEditForm = () => {
		flushPendingSave();
		navigateToForm( formRef, 'widget' );
	};

	return (
		<div { ...blockProps }>
			<Notice
				className="jetpack-contact-form-widget-readonly-notice"
				status="info"
				isDismissible={ false }
				actions={ [
					{
						label: __( 'Edit Form', 'jetpack-forms' ),
						onClick: handleEditForm,
						variant: 'primary',
					},
				] }
			>
				{ __(
					'Forms are edited in the Form Editor. Changes will sync back to this widget.',
					'jetpack-forms'
				) }
			</Notice>
			{ isResolvingSyncedForm ? (
				<ContactFormSkeletonLoader />
			) : (
				<Disabled>
					<div { ...innerBlocksProps } />
				</Disabled>
			) }
		</div>
	);
}
