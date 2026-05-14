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

interface CategorySetupModalProps {
	siteName: string;
	existingTitle: string;
	onClose: () => void;
	onSuccess: () => void;
}

const parseErrorMessage = ( error: unknown, fallback: string ): string => {
	if ( error instanceof Error ) {
		return error.message;
	}
	if (
		error &&
		typeof error === 'object' &&
		'message' in error &&
		typeof ( error as { message: unknown } ).message === 'string'
	) {
		return ( error as { message: string } ).message;
	}
	return fallback;
};

const CategorySetupModal = ( {
	siteName,
	existingTitle,
	onClose,
	onSuccess,
}: CategorySetupModalProps ) => {
	const { mutate: saveSettings } = useUpdatePodcastSettings();

	const [ categoryId, setCategoryId ] = useState( 0 );
	const [ error, setError ] = useState< string | null >( null );
	const [ saving, setSaving ] = useState( false );

	const titleToSave = siteName.trim() || existingTitle;

	const requestClose = useCallback( () => {
		// Block dismissal while a save is in flight so the in-flight promise
		// can't mutate settings after the user thought they cancelled.
		if ( saving ) {
			return;
		}
		onClose();
	}, [ saving, onClose ] );

	const onConfirm = useCallback( async () => {
		if ( ! categoryId ) {
			return;
		}
		setError( null );
		setSaving( true );
		try {
			await new Promise< void >( ( resolve, reject ) => {
				saveSettings(
					{
						podcasting_title: titleToSave,
						podcasting_category_id: categoryId,
					},
					{ onSuccess: () => resolve(), onError: reject }
				);
			} );
			onSuccess();
		} catch ( err ) {
			setError(
				parseErrorMessage(
					err,
					__( 'Could not save your podcast settings. Please try again.', 'jetpack-podcast' )
				)
			);
		} finally {
			setSaving( false );
		}
	}, [ categoryId, titleToSave, saveSettings, onSuccess ] );

	return (
		<Modal title={ __( 'Set up your podcast', 'jetpack-podcast' ) } onRequestClose={ requestClose }>
			<VStack spacing={ 4 }>
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
				<CategoryPicker selectedId={ categoryId } onSelect={ setCategoryId } disabled={ saving } />
				<HStack justify="flex-end" spacing={ 3 }>
					<Button variant="tertiary" onClick={ requestClose } disabled={ saving }>
						{ __( 'Cancel', 'jetpack-podcast' ) }
					</Button>
					<Button
						variant="primary"
						onClick={ onConfirm }
						disabled={ ! categoryId || saving }
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
