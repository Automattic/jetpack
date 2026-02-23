/**
 * WordPress dependencies
 */
import { Button, Modal, SelectControl } from '@wordpress/components';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';

type StatusOption = {
	label: string;
	value: string;
};

export type ChangeFormStatusModalProps = {
	isOpen: boolean;
	itemsCount: number;
	initialStatus?: string;
	statusOptions?: StatusOption[];
	onClose: () => void;
	onConfirm: ( nextStatus: string ) => Promise< void >;
};

const DEFAULT_STATUS_OPTIONS: StatusOption[] = [
	{ label: __( 'Published', 'jetpack-forms' ), value: 'publish' },
	{ label: __( 'Draft', 'jetpack-forms' ), value: 'draft' },
	{ label: __( 'Private', 'jetpack-forms' ), value: 'private' },
	{ label: __( 'Pending review', 'jetpack-forms' ), value: 'pending' },
];

/**
 * Modal for changing the status of one or more forms.
 *
 * @param props - Component props.
 * @return The modal element, or null when closed.
 */
export default function ChangeFormStatusModal( props: ChangeFormStatusModalProps ) {
	const { isOpen, itemsCount, initialStatus, statusOptions, onClose, onConfirm } = props;
	const options = useMemo( () => statusOptions || DEFAULT_STATUS_OPTIONS, [ statusOptions ] );
	const [ selectedStatus, setSelectedStatus ] = useState(
		initialStatus || options[ 0 ]?.value || ''
	);
	const [ isSaving, setIsSaving ] = useState( false );

	useEffect( () => {
		if ( isOpen ) {
			setSelectedStatus( initialStatus || options[ 0 ]?.value || '' );
		}
	}, [ initialStatus, isOpen, options ] );

	const title = useMemo( () => {
		return itemsCount === 1
			? __( 'Change status', 'jetpack-forms' )
			: sprintf(
					/* translators: %d: number of forms. */
					_n(
						'Change status for %d form',
						'Change status for %d forms',
						itemsCount,
						'jetpack-forms'
					),
					itemsCount
			  );
	}, [ itemsCount ] );

	const isConfirmDisabled = useMemo( () => {
		if ( ! selectedStatus ) {
			return true;
		}
		if ( isSaving ) {
			return true;
		}
		return itemsCount === 1 && initialStatus && selectedStatus === initialStatus;
	}, [ initialStatus, isSaving, itemsCount, selectedStatus ] );

	const handleClose = useCallback( () => {
		if ( ! isSaving ) {
			onClose();
		}
	}, [ isSaving, onClose ] );

	const handleConfirm = useCallback( async () => {
		if ( isConfirmDisabled ) {
			return;
		}

		setIsSaving( true );
		try {
			await onConfirm( selectedStatus );
			onClose();
		} catch {
			// Error handling is delegated to the caller; keep modal open for retry.
		} finally {
			setIsSaving( false );
		}
	}, [ isConfirmDisabled, onClose, onConfirm, selectedStatus ] );

	if ( ! isOpen ) {
		return null;
	}

	return (
		<Modal title={ title } onRequestClose={ handleClose } size="medium">
			<SelectControl
				label={ __( 'New status', 'jetpack-forms' ) }
				value={ selectedStatus }
				options={ options }
				onChange={ setSelectedStatus }
				__next40pxDefaultSize
				disabled={ isSaving }
			/>
			<div className="jp-forms-name-modal__buttons">
				<Button variant="tertiary" onClick={ handleClose } disabled={ isSaving }>
					{ __( 'Cancel', 'jetpack-forms' ) }
				</Button>
				<Button
					aria-disabled={ isConfirmDisabled }
					disabled={ isConfirmDisabled }
					isBusy={ isSaving }
					variant="primary"
					onClick={ handleConfirm }
				>
					{ __( 'Apply', 'jetpack-forms' ) }
				</Button>
			</div>
		</Modal>
	);
}
