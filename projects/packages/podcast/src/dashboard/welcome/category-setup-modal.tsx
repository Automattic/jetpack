import {
	Button,
	Modal,
	Notice,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalHStack as HStack,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalText as Text,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import CategoryPicker from '../category-picker';
import { useUpdatePodcastSettings } from '../hooks/use-podcast-settings';
import { parseErrorMessage } from '../parse-error-message';
import type { PodcastSettingsUpdate } from '../types';

interface CategorySetupModalProps {
	siteName: string;
	existingTitle: string;
	onClose: () => void;
	onSuccess: () => void;
}

const CategorySetupModal = ( {
	siteName,
	existingTitle,
	onClose,
	onSuccess,
}: CategorySetupModalProps ) => {
	const { mutateAsync: saveSettings, isPending: saving } = useUpdatePodcastSettings();

	const [ categoryId, setCategoryId ] = useState( 0 );
	const [ error, setError ] = useState< string | null >( null );
	const [ pickerCreating, setPickerCreating ] = useState( false );
	const [ pickerSaving, setPickerSaving ] = useState( false );
	// The picker flips `pickerCreating` false before our `onConfirm` runs,
	// so without this gate the outer button row briefly remounts in the gap
	// before the modal unmounts — visible as a flash.
	const [ committingFromCreate, setCommittingFromCreate ] = useState( false );

	const isSaving = saving || pickerSaving;

	const requestClose = useCallback( () => {
		// Otherwise an in-flight save can mutate settings after the user
		// thought they cancelled.
		if ( isSaving ) {
			return;
		}
		onClose();
	}, [ isSaving, onClose ] );

	const onConfirm = useCallback(
		// `idArg` lets the inline-create path commit the save in the same click,
		// without waiting for the async `setCategoryId` to flush.
		async ( idArg?: number ) => {
			const id = idArg ?? categoryId;
			if ( ! id ) {
				return;
			}
			setError( null );
			try {
				// Only prefill the title from the site name when the user hasn't
				// already set one — preserves a custom title from a partial setup.
				const updates: PodcastSettingsUpdate = { podcasting_category_id: id };
				if ( ! existingTitle && siteName.trim() ) {
					updates.podcasting_title = siteName.trim();
				}
				// Inline Notice handles errors; suppress the hook's snackbar.
				await saveSettings( updates, { silent: true } );
				onSuccess();
			} catch ( err ) {
				setError(
					parseErrorMessage(
						err,
						__( 'Could not save your podcast settings. Please try again.', 'jetpack-podcast' )
					)
				);
				// Lets the inline-create path reset the picker.
				throw err;
			}
		},
		[ categoryId, existingTitle, siteName, saveSettings, onSuccess ]
	);

	const handleCreateSuccess = useCallback(
		async ( id: number ) => {
			setCommittingFromCreate( true );
			try {
				await onConfirm( id );
			} catch ( err ) {
				setCommittingFromCreate( false );
				// Lets the picker reset its busy state.
				throw err;
			}
		},
		[ onConfirm ]
	);

	const handleExistingCategoryConfirm = useCallback( () => {
		// onConfirm's inline Notice handles the error UX.
		onConfirm().catch( () => {} );
	}, [ onConfirm ] );

	return (
		<Modal
			title={ __( 'Set up your podcast', 'jetpack-podcast' ) }
			onRequestClose={ requestClose }
			// `onRequestClose` doesn't catch every dismissal path; belt-and-suspenders.
			shouldCloseOnEsc={ ! isSaving }
			shouldCloseOnClickOutside={ ! isSaving }
		>
			<VStack spacing={ 4 }>
				<Text weight={ 600 }>
					{ __( 'Select a post category for your podcast', 'jetpack-podcast' ) }
				</Text>
				<Text variant="muted">
					{ __(
						'Posts in the category you choose become episodes in your podcast feed. You can change this later in Settings.',
						'jetpack-podcast'
					) }
				</Text>
				{ error && (
					<Notice status="error" isDismissible={ false }>
						{ error }
					</Notice>
				) }
				<CategoryPicker
					selectedId={ categoryId }
					onSelect={ setCategoryId }
					disabled={ saving }
					onCreatingChange={ setPickerCreating }
					onSavingChange={ setPickerSaving }
					onCreateSuccess={ handleCreateSuccess }
				/>
				{ ! pickerCreating && ! committingFromCreate && (
					<HStack justify="flex-end" spacing={ 3 }>
						<Button variant="tertiary" onClick={ requestClose } disabled={ isSaving }>
							{ __( 'Cancel', 'jetpack-podcast' ) }
						</Button>
						<Button
							variant="primary"
							onClick={ handleExistingCategoryConfirm }
							disabled={ ! categoryId || saving }
							isBusy={ saving }
						>
							{ __( 'Confirm', 'jetpack-podcast' ) }
						</Button>
					</HStack>
				) }
			</VStack>
		</Modal>
	);
};

export default CategorySetupModal;
