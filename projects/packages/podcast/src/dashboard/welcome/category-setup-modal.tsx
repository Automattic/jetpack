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
	// Tracks the inline-create commit flow from the moment the picker finishes
	// creating the category until the modal unmounts. The picker flips
	// `pickerCreating` false before our `onConfirm` runs, so without this gate
	// the outer Cancel/Confirm row briefly remounts (with `isBusy`) in the
	// window between picker resolve and modal close — visible as a flash.
	const [ committingFromCreate, setCommittingFromCreate ] = useState( false );

	const isSaving = saving || pickerSaving;

	const requestClose = useCallback( () => {
		// Block dismissal while a save is in flight so the in-flight promise
		// can't mutate settings after the user thought they cancelled. The
		// picker's own save needs the same gate, because its success callback
		// reaches back here to commit settings.
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
				// Inline Notice below covers the error UX; suppress the hook's
				// duplicate snackbar. Success is implicit (modal closes and
				// lands the user on a populated Settings tab).
				await saveSettings( updates, { silent: true } );
				onSuccess();
			} catch ( err ) {
				setError(
					parseErrorMessage(
						err,
						__( 'Could not save your podcast settings. Please try again.', 'jetpack-podcast' )
					)
				);
				// Re-throw so the inline-create path can reset the picker; the
				// existing-category caller catches and discards.
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
				// Restore the outer Cancel/Confirm row so the user can retry or
				// dismiss; re-throw so the picker resets its own busy state.
				setCommittingFromCreate( false );
				throw err;
			}
		},
		[ onConfirm ]
	);

	const handleExistingCategoryConfirm = useCallback( () => {
		// onConfirm's inline Notice owns the error UX; swallow the rejection.
		onConfirm().catch( () => {} );
	}, [ onConfirm ] );

	return (
		<Modal
			title={ __( 'Set up your podcast', 'jetpack-podcast' ) }
			onRequestClose={ requestClose }
			// Belt-and-suspenders: some Modal force-close paths skip
			// `onRequestClose`, so disable Esc/backdrop dismissal directly
			// while a save is in flight.
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
				{ /* Hide the outer Cancel/Confirm row while the inline create
				     form is open. The inline form has its own Cancel/Create row
				     and the create flow commits settings on success, so showing
				     both rows looks like two competing actions. Keep it hidden
				     through the create-driven commit so the row doesn't flash
				     in for one render as the picker collapses. */ }
				{ ! pickerCreating && ! committingFromCreate && (
					<HStack justify="flex-end" spacing={ 3 }>
						<Button variant="tertiary" onClick={ requestClose } disabled={ isSaving }>
							{ __( 'Cancel', 'jetpack-podcast' ) }
						</Button>
						<Button
							variant="primary"
							// The inline-create path commits via `handleCreateSuccess`, so
							// Confirm is only used when the user picks an existing category.
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
