import { Notice } from '@wordpress/components';
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
		status: 'warning',
		getMessage: () =>
			__(
				'Private form. Currently hidden from site visitors and not accepting any responses.',
				'jetpack-forms'
			),
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
}: FormStatusNoticeProps ) {
	const [ isPublishing, setIsPublishing ] = useState( false );

	const { editEntityRecord, saveEditedEntityRecord } = useDispatch( coreStore );
	const { createErrorNotice, createSuccessNotice } = useDispatch( noticesStore );

	const handlePublish = useCallback( async () => {
		if ( ! formRef ) {
			return;
		}
		setIsPublishing( true );
		try {
			await editEntityRecord( 'postType', FORM_POST_TYPE, formRef, { status: 'publish' } );
			await saveEditedEntityRecord( 'postType', FORM_POST_TYPE, formRef );
			createSuccessNotice( __( 'Form is live and ready to accept responses.', 'jetpack-forms' ), {
				type: 'snackbar',
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
		editEntityRecord,
		saveEditedEntityRecord,
		createSuccessNotice,
		createErrorNotice,
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
	if ( formStatus !== 'trash' ) {
		actions.push( {
			label: __( 'Publish', 'jetpack-forms' ),
			onClick: handlePublish,
			variant: 'secondary',
			disabled: isPublishing,
		} );
	}

	return (
		<Notice
			status={ noticeStatus }
			isDismissible={ false }
			className="jetpack-contact-form__status-notice"
			actions={ actions }
		>
			{ message }
		</Notice>
	);
}
