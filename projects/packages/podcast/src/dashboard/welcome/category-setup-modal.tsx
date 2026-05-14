import {
	Button,
	Modal,
	Notice,
	SelectControl,
	Spinner,
	TextControl,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalHStack as HStack,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalText as Text,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useUpdatePodcastSettings } from '../hooks/use-podcast-settings';
import { useCategoriesQuery } from '../settings/use-categories-query';

// Sentinel for the "create new category" option in the select.
const CREATE_NEW = '__create_new__';

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
	const { data: categories = [], isLoading: categoriesLoading } = useCategoriesQuery();
	const { mutate: saveSettings } = useUpdatePodcastSettings();
	const { saveEntityRecord } = useDispatch( coreStore );

	// `canUser` returns `undefined` while resolving. Treat that as allowed so
	// the option doesn't flash hidden; only hide once the OPTIONS probe says no.
	const canCreateCategory = useSelect(
		select => select( coreStore ).canUser( 'create', 'categories' ),
		[]
	);

	const [ selected, setSelected ] = useState< string >( '' );
	const [ newCategoryName, setNewCategoryName ] = useState( '' );
	const [ error, setError ] = useState< string | null >( null );
	const [ saving, setSaving ] = useState( false );

	const isCreating = selected === CREATE_NEW;
	const trimmedNewName = newCategoryName.trim();
	const titleToSave = siteName.trim() || existingTitle;

	const requestClose = useCallback( () => {
		// Block dismissal while a save is in flight so the in-flight promise
		// can't mutate settings after the user thought they cancelled.
		if ( saving ) {
			return;
		}
		onClose();
	}, [ saving, onClose ] );

	const confirmDisabled = saving || ! selected || ( isCreating && trimmedNewName === '' );

	const onConfirm = useCallback( async () => {
		setError( null );
		setSaving( true );
		try {
			let categoryId: number;
			if ( isCreating ) {
				// `saveEntityRecord` silently resolves `undefined` on REST errors
				// without `throwOnError`; opt in so duplicate names / capability
				// failures fall into the catch instead of vanishing.
				const result = ( await saveEntityRecord(
					'taxonomy',
					'category',
					{ name: trimmedNewName },
					{ throwOnError: true }
				) ) as { id?: number } | undefined;
				if ( ! result?.id ) {
					throw new Error(
						__( 'Could not create the category. Please try again.', 'jetpack-podcast' )
					);
				}
				categoryId = Number( result.id );
			} else {
				categoryId = Number( selected ) || 0;
			}

			if ( ! categoryId ) {
				throw new Error( __( 'Please select a category before continuing.', 'jetpack-podcast' ) );
			}

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
	}, [
		isCreating,
		trimmedNewName,
		selected,
		titleToSave,
		saveEntityRecord,
		saveSettings,
		onSuccess,
	] );

	const options: Array< { label: string; value: string } > = [
		{ label: __( '— Select a category —', 'jetpack-podcast' ), value: '' },
		...categories.map( cat => ( { label: cat.name, value: String( cat.id ) } ) ),
	];
	if ( canCreateCategory !== false ) {
		options.push( {
			label: __( 'Create a new category…', 'jetpack-podcast' ),
			value: CREATE_NEW,
		} );
	}

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
				{ categoriesLoading ? (
					<HStack justify="flex-start" spacing={ 2 }>
						<Spinner />
						<Text variant="muted">{ __( 'Loading categories…', 'jetpack-podcast' ) }</Text>
					</HStack>
				) : (
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Podcast category', 'jetpack-podcast' ) }
						value={ selected }
						onChange={ setSelected }
						options={ options }
						disabled={ saving }
					/>
				) }
				{ isCreating && (
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'New category name', 'jetpack-podcast' ) }
						value={ newCategoryName }
						onChange={ setNewCategoryName }
						disabled={ saving }
					/>
				) }
				<HStack justify="flex-end" spacing={ 3 }>
					<Button variant="tertiary" onClick={ requestClose } disabled={ saving }>
						{ __( 'Cancel', 'jetpack-podcast' ) }
					</Button>
					<Button
						variant="primary"
						onClick={ onConfirm }
						disabled={ confirmDisabled }
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
