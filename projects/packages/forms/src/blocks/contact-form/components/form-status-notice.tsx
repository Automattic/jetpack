import { store as blockEditorStore } from '@wordpress/block-editor';
import { Button, Modal, Notice } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { useState, useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { FORM_POST_TYPE } from '../../shared/util/constants.js';

type SyncedForm = {
	status?: string;
	date?: string;
};

type FormStatusNoticeProps = {
	syncedForm: SyncedForm | null;
	formRef: number | undefined;
	isVisible: boolean;
	clientId: string;
};

const STATUS_CONFIG: Record<
	string,
	{ status: 'error' | 'warning' | 'info'; getMessage: ( form: SyncedForm | null ) => string }
> = {
	trash: {
		status: 'error',
		getMessage: () =>
			__(
				'Trashed form. Currently hidden from site visitors and not accepting any responses.',
				'jetpack-forms'
			),
	},
	draft: {
		status: 'warning',
		getMessage: () =>
			__(
				'Draft form. Currently hidden from site visitors and not accepting any responses.',
				'jetpack-forms'
			),
	},
	pending: {
		status: 'warning',
		getMessage: () =>
			__(
				'Pending review form. Currently hidden from site visitors until approved and published.',
				'jetpack-forms'
			),
	},
	private: {
		status: 'info',
		getMessage: () => __( 'Private form. Currently hidden from site visitors.', 'jetpack-forms' ),
	},
	future: {
		status: 'info',
		getMessage: form => {
			const dateSettings = getDateSettings();
			const dateFormat = dateSettings.formats.datetime || 'F j, Y g:i a';

			const message = form?.date
				? sprintf(
						/* translators: %s: scheduled publish date */
						__(
							'Scheduled form. It will be published on %s but will remain hidden from site visitors until then.',
							'jetpack-forms'
						),
						dateI18n( dateFormat, form.date )
				  )
				: __(
						'Scheduled form. It will not be displayed to site visitors until its publish date.',
						'jetpack-forms'
				  );
			return message;
		},
	},
};

export default function FormStatusNotice( {
	syncedForm,
	formRef,
	isVisible,
	clientId,
}: FormStatusNoticeProps ) {
	const [ isPublishing, setIsPublishing ] = useState( false );
	const [ isDeleting, setIsDeleting ] = useState( false );
	const [ showDeleteConfirmation, setShowDeleteConfirmation ] = useState( false );

	const { editEntityRecord, saveEditedEntityRecord, deleteEntityRecord } = useDispatch( coreStore );
	const { createErrorNotice, createSuccessNotice } = useDispatch( noticesStore );

	const { removeBlocks } = useDispatch( blockEditorStore );

	const handleUndo = useCallback(
		async ( previousStatus: string, previousDate?: string ) => {
			if ( ! formRef ) {
				return;
			}
			try {
				if ( previousStatus === 'trash' ) {
					previousStatus = 'draft'; // Moving to trash from publish to draft can't be undone directly.
				}
				await editEntityRecord( 'postType', FORM_POST_TYPE, formRef, {
					status: previousStatus,
					date: previousDate,
				} );
				await saveEditedEntityRecord( 'postType', FORM_POST_TYPE, formRef );
			} catch {
				createErrorNotice(
					__( 'Failed to undo. Refresh this page and try again.', 'jetpack-forms' ),
					{ type: 'snackbar' }
				);
			}
		},
		[ formRef, editEntityRecord, saveEditedEntityRecord, createErrorNotice ]
	);

	const handlePublish = useCallback( async () => {
		if ( ! formRef ) {
			return;
		}
		const previousStatus = syncedForm?.status;
		const previousDate = syncedForm?.date;

		setIsPublishing( true );
		try {
			const formUpdate: { status: string; date?: string } = {
				status: 'publish',
			};
			if ( previousStatus === 'future' ) {
				// If the form was previously scheduled, clear the date to publish immediately.
				formUpdate.date = new Date().toISOString();
			}
			await editEntityRecord( 'postType', FORM_POST_TYPE, formRef, formUpdate );
			await saveEditedEntityRecord( 'postType', FORM_POST_TYPE, formRef );
			createSuccessNotice( __( 'Form is live and ready to accept responses.', 'jetpack-forms' ), {
				type: 'snackbar',
				actions: previousStatus
					? [
							{
								label: __( 'Undo', 'jetpack-forms' ),
								onClick: () => handleUndo( previousStatus, previousDate ),
							},
					  ]
					: [],
			} );
		} catch {
			createErrorNotice(
				__( 'Failed to publish form. Refresh this page and try again.', 'jetpack-forms' ),
				{ type: 'snackbar' }
			);
		} finally {
			setIsPublishing( false );
		}
	}, [
		formRef,
		syncedForm?.status,
		syncedForm?.date,
		editEntityRecord,
		saveEditedEntityRecord,
		createSuccessNotice,
		createErrorNotice,
		handleUndo,
	] );

	const handleDeletePermanently = useCallback( async () => {
		if ( ! formRef ) {
			return;
		}
		setIsDeleting( true );
		try {
			// delete the entry permanently
			await deleteEntityRecord( 'postType', FORM_POST_TYPE, formRef, { force: true } );
			createSuccessNotice( __( 'Form deleted permanently.', 'jetpack-forms' ), {
				type: 'snackbar',
			} );
			removeBlocks( [ clientId ] );
		} catch {
			createErrorNotice(
				__(
					'Failed to delete form permanently. Refresh this page and try again.',
					'jetpack-forms'
				),
				{ type: 'snackbar' }
			);
		} finally {
			setIsDeleting( false );
		}
	}, [
		formRef,
		createSuccessNotice,
		createErrorNotice,
		removeBlocks,
		deleteEntityRecord,
		clientId,
	] );
	const formStatus = syncedForm?.status;

	if ( ! isVisible || ! formRef || ! formStatus || formStatus === 'publish' ) {
		return null;
	}

	const config = STATUS_CONFIG[ formStatus ];
	const noticeStatus = config?.status || 'warning';
	const message =
		config?.getMessage( syncedForm ) ||
		sprintf(
			/* translators: %s: form status */
			__(
				'This form has status "%s" and will not be displayed on the frontend until it is published.',
				'jetpack-forms'
			),
			formStatus
		);

	const actions = [];

	actions.push( {
		label: __( 'Publish', 'jetpack-forms' ),
		onClick: handlePublish,
		variant: 'secondary',
		disabled: isPublishing,
	} );
	if ( formStatus === 'trash' ) {
		actions.push( {
			label: __( 'Delete', 'jetpack-forms' ),
			onClick: () => setShowDeleteConfirmation( true ),
			variant: 'secondary',
			disabled: isDeleting,
		} );
	}

	return (
		<>
			<Notice
				status={ noticeStatus }
				isDismissible={ false }
				className="jetpack-contact-form__status-notice"
				actions={ actions }
			>
				{ message }
			</Notice>
			{ showDeleteConfirmation && (
				<Modal
					title={ __( 'Delete form permanently?', 'jetpack-forms' ) }
					onRequestClose={ () => setShowDeleteConfirmation( false ) }
					size="small"
				>
					<p>
						{ __(
							'Are you sure you want to delete this form? This action cannot be undone.',
							'jetpack-forms'
						) }
					</p>
					<div
						style={ {
							display: 'flex',
							justifyContent: 'flex-end',
							gap: '8px',
							marginTop: '16px',
						} }
					>
						<Button variant="tertiary" onClick={ () => setShowDeleteConfirmation( false ) }>
							{ __( 'Cancel', 'jetpack-forms' ) }
						</Button>
						<Button
							variant="primary"
							isDestructive
							isBusy={ isDeleting }
							onClick={ () => {
								setShowDeleteConfirmation( false );
								handleDeletePermanently();
							} }
						>
							{ __( 'Delete Permanently', 'jetpack-forms' ) }
						</Button>
					</div>
				</Modal>
			) }
		</>
	);
}
