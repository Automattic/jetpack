import {
	Button,
	Notice,
	SelectControl,
	TextControl,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalHStack as HStack,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useCategoriesQuery } from './hooks/use-categories-query';

// Sentinel for the "create new category" option in the select.
const CREATE_NEW = '__create_new__';

interface CategoryPickerProps {
	selectedId: number;
	onSelect: ( id: number ) => void;
	disabled?: boolean;
	// Fires when the inline "create a new category" form opens/closes, so a
	// containing modal can gate its own Confirm button until the user either
	// finishes or cancels the inline flow.
	onCreatingChange?: ( isCreating: boolean ) => void;
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

const CategoryPicker = ( {
	selectedId,
	onSelect,
	disabled = false,
	onCreatingChange,
}: CategoryPickerProps ) => {
	const { data: categories = [], isLoading } = useCategoriesQuery();
	const { saveEntityRecord } = useDispatch( coreStore );

	// `canUser` returns `undefined` while resolving. Treat that as allowed so
	// the option doesn't flash hidden; only hide once the OPTIONS probe says no.
	const canCreateCategory = useSelect(
		select => select( coreStore ).canUser( 'create', 'categories' ),
		[]
	);

	const [ isCreating, setIsCreating ] = useState( false );
	const [ newName, setNewName ] = useState( '' );
	const [ createError, setCreateError ] = useState< string | null >( null );
	const [ saving, setSaving ] = useState( false );

	useEffect( () => {
		onCreatingChange?.( isCreating );
	}, [ isCreating, onCreatingChange ] );

	const trimmedName = newName.trim();

	const handleSelectChange = useCallback(
		( value: string ) => {
			if ( value === CREATE_NEW ) {
				setIsCreating( true );
				setNewName( '' );
				setCreateError( null );
				return;
			}
			// Picking a regular option from the dropdown while the inline
			// create form is open should dismiss it; otherwise the select
			// snaps back to CREATE_NEW on the next render.
			setIsCreating( false );
			setNewName( '' );
			setCreateError( null );
			onSelect( Number( value ) || 0 );
		},
		[ onSelect ]
	);

	const cancelCreate = useCallback( () => {
		if ( saving ) {
			return;
		}
		setIsCreating( false );
		setNewName( '' );
		setCreateError( null );
	}, [ saving ] );

	const createCategory = useCallback( async () => {
		if ( ! trimmedName ) {
			return;
		}
		setSaving( true );
		setCreateError( null );
		try {
			// `saveEntityRecord` silently resolves `undefined` on REST errors
			// without `throwOnError`; opt in so duplicate names / capability
			// failures fall into the catch instead of vanishing.
			const result = ( await saveEntityRecord(
				'taxonomy',
				'category',
				{ name: trimmedName },
				{ throwOnError: true }
			) ) as { id?: number } | undefined;
			if ( ! result?.id ) {
				throw new Error(
					__( 'Could not create the category. Please try again.', 'jetpack-podcast' )
				);
			}
			setIsCreating( false );
			setNewName( '' );
			onSelect( Number( result.id ) );
		} catch ( err ) {
			setCreateError(
				parseErrorMessage(
					err,
					__( 'Could not create the category. Please try again.', 'jetpack-podcast' )
				)
			);
		} finally {
			setSaving( false );
		}
	}, [ trimmedName, saveEntityRecord, onSelect ] );

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
		<VStack spacing={ 3 }>
			<SelectControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ __( 'Post category', 'jetpack-podcast' ) }
				hideLabelFromVision
				value={ isCreating ? CREATE_NEW : String( selectedId || '' ) }
				onChange={ handleSelectChange }
				options={ options }
				disabled={ disabled || isLoading || saving }
			/>
			{ isCreating && (
				<VStack spacing={ 2 }>
					{ createError && (
						<Notice status="error" isDismissible={ false }>
							{ createError }
						</Notice>
					) }
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'New category name', 'jetpack-podcast' ) }
						value={ newName }
						onChange={ setNewName }
						disabled={ disabled || saving }
					/>
					<HStack justify="flex-end" spacing={ 3 }>
						<Button variant="tertiary" onClick={ cancelCreate } disabled={ disabled || saving }>
							{ __( 'Cancel', 'jetpack-podcast' ) }
						</Button>
						<Button
							variant="primary"
							onClick={ createCategory }
							disabled={ disabled || trimmedName === '' || saving }
							isBusy={ saving }
						>
							{ __( 'Create', 'jetpack-podcast' ) }
						</Button>
					</HStack>
				</VStack>
			) }
		</VStack>
	);
};

export default CategoryPicker;
