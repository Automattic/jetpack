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
	const { mutate: saveSettings, isPending: saving } = useUpdatePodcastSettings();

	const [ categoryId, setCategoryId ] = useState( 0 );
	const [ error, setError ] = useState< string | null >( null );
	const [ pickerCreating, setPickerCreating ] = useState( false );
	const [ pickerSaving, setPickerSaving ] = useState( false );

	const requestClose = useCallback( () => {
		// Block dismissal while a save is in flight so the in-flight promise
		// can't mutate settings after the user thought they cancelled. The
		// picker's own save needs the same gate, because its success callback
		// reaches back here to commit settings.
		if ( saving || pickerSaving ) {
			return;
		}
		onClose();
	}, [ saving, pickerSaving, onClose ] );

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
				await new Promise< void >( ( resolve, reject ) => {
					saveSettings( updates, {
						onSuccess: () => resolve(),
						onError: reject,
						// Inline Notice below covers the error UX; suppress the hook's
						// duplicate snackbar. Success is implicit (modal closes and
						// lands the user on a populated Settings tab).
						silent: true,
					} );
				} );
				onSuccess();
			} catch ( err ) {
				setError(
					parseErrorMessage(
						err,
						__( 'Could not save your podcast settings. Please try again.', 'jetpack-podcast' )
					)
				);
			}
		},
		[ categoryId, existingTitle, siteName, saveSettings, onSuccess ]
	);

	const handleCreateSuccess = useCallback(
		( id: number ) => {
			onConfirm( id );
		},
		[ onConfirm ]
	);

	const handleExistingCategoryConfirm = useCallback( () => {
		onConfirm();
	}, [ onConfirm ] );

	return (
		<Modal
			title={ __( 'Set up your podcast', 'jetpack-podcast' ) }
			onRequestClose={ requestClose }
			// Belt-and-suspenders: some Modal force-close paths skip
			// `onRequestClose`, so disable Esc/backdrop dismissal directly
			// while a save is in flight.
			shouldCloseOnEsc={ ! ( saving || pickerSaving ) }
			shouldCloseOnClickOutside={ ! ( saving || pickerSaving ) }
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
				<HStack justify="flex-end" spacing={ 3 }>
					<Button variant="tertiary" onClick={ requestClose } disabled={ saving || pickerSaving }>
						{ __( 'Cancel', 'jetpack-podcast' ) }
					</Button>
					<Button
						variant="primary"
						// The inline-create path commits via `handleCreateSuccess`, so
						// Confirm is only used when the user picks an existing category.
						onClick={ handleExistingCategoryConfirm }
						// Block Confirm while the inline create form is open so
						// the user can't commit a stale `selectedId` with the
						// half-filled inline form still mounted.
						disabled={ ! categoryId || saving || pickerCreating }
						isBusy={ saving }
					>
						{ __( 'Confirm', 'jetpack-podcast' ) }
					</Button>
				</HStack>
			</VStack>
		</Modal>
	);
};

export default CategorySetupModal;
