/**
 * Form Selector Component
 *
 * Allows users to select an existing jetpack_form CPT or create a new one.
 * This enables form reusability across multiple posts/pages.
 */

import apiFetch from '@wordpress/api-fetch';
import { SelectControl, Button, Spinner, Notice, TextControl } from '@wordpress/components';
import { debounce } from '@wordpress/compose';
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

interface FormSelectorProps {
	formRef: number;
	onFormSelect: ( formId: number ) => void;
	currentFormTitle?: string;
}

interface JetpackForm {
	id: number;
	title: {
		rendered: string;
	};
	date: string;
	modified: string;
}

interface FormsResponse {
	forms: JetpackForm[];
}

/**
 * Component to select a form from available jetpack_form CPTs
 *
 * @param {object}   props                  - Component props
 * @param {number}   props.formRef          - Current form reference ID
 * @param {Function} props.onFormSelect     - Callback when form is selected
 * @param {string}   props.currentFormTitle - Title of current form
 * @return {JSX.Element} Form selector component
 */
export default function FormSelector( {
	formRef,
	onFormSelect,
	currentFormTitle = '',
}: FormSelectorProps ): JSX.Element {
	const [ forms, setForms ] = useState< JetpackForm[] >( [] );
	const [ isLoading, setIsLoading ] = useState( true );
	const [ error, setError ] = useState< string | null >( null );
	const [ isCreatingNew, setIsCreatingNew ] = useState( false );
	const [ formTitle, setFormTitle ] = useState( currentFormTitle );
	const [ isSavingTitle, setIsSavingTitle ] = useState( false );

	// Update local title when currentFormTitle changes (e.g., when switching forms)
	useEffect( () => {
		setFormTitle( currentFormTitle );
	}, [ currentFormTitle ] );

	// Debounced function to save form title
	const debouncedSaveTitle = debounce( ( newTitle: string ) => {
		if ( ! formRef || formRef === 0 ) {
			return;
		}

		setIsSavingTitle( true );

		apiFetch( {
			path: `/wp/v2/jetpack-forms/${ formRef }`,
			method: 'POST',
			data: {
				title: newTitle,
			},
		} )
			.then( () => {
				setIsSavingTitle( false );
				// Refresh the forms list to show updated title
				return apiFetch< JetpackForm[] >( {
					path: addQueryArgs( '/wp/v2/jetpack-forms', {
						per_page: 100,
						orderby: 'modified',
						order: 'desc',
					} ),
				} );
			} )
			.then( fetchedForms => {
				if ( fetchedForms ) {
					setForms( fetchedForms );
				}
			} )
			.catch( err => {
				setIsSavingTitle( false );
				console.error( 'Failed to save form title:', err );
			} );
	}, 1000 );

	// Handle title change
	const handleTitleChange = ( newTitle: string ) => {
		setFormTitle( newTitle );
		debouncedSaveTitle( newTitle );
	};

	// Load available forms
	useEffect( () => {
		setIsLoading( true );
		setError( null );

		const queryArgs = {
			per_page: 100,
			orderby: 'modified',
			order: 'desc',
		};

		apiFetch< JetpackForm[] >( {
			path: addQueryArgs( '/wp/v2/jetpack-forms', queryArgs ),
		} )
			.then( fetchedForms => {
				setForms( fetchedForms );
				setIsLoading( false );
			} )
			.catch( err => {
				setError(
					err.message || __( 'Failed to load forms. Please refresh the page.', 'jetpack-forms' )
				);
				setIsLoading( false );
			} );
	}, [] );

	// Create a new form
	const handleCreateNew = () => {
		setIsCreatingNew( true );
		setError( null );

		apiFetch< { success: boolean; form_id: number; message: string } >( {
			path: '/jetpack-forms/v1/forms/create-from-block',
			method: 'POST',
			data: {
				title: __( 'New Form', 'jetpack-forms' ),
				blocks: '',
				settings: {},
				integrations: {},
			},
		} )
			.then( response => {
				if ( response.success && response.form_id ) {
					onFormSelect( response.form_id );
					// Refresh the forms list
					return apiFetch< JetpackForm[] >( {
						path: addQueryArgs( '/wp/v2/jetpack-forms', {
							per_page: 100,
							orderby: 'modified',
							order: 'desc',
						} ),
					} );
				}
				throw new Error( response.message );
			} )
			.then( fetchedForms => {
				if ( fetchedForms ) {
					setForms( fetchedForms );
				}
				setIsCreatingNew( false );
			} )
			.catch( err => {
				setError(
					err.message || __( 'Failed to create new form. Please try again.', 'jetpack-forms' )
				);
				setIsCreatingNew( false );
			} );
	};

	// Handle form selection
	const handleFormChange = ( value: string ) => {
		const selectedId = parseInt( value, 10 );
		if ( selectedId && selectedId !== formRef ) {
			onFormSelect( selectedId );
		}
	};

	// Build options for SelectControl
	const formOptions = [
		{
			label: __( '-- Select a form --', 'jetpack-forms' ),
			value: '0',
			disabled: true,
		},
		...forms.map( form => ( {
			label: form.title.rendered || __( '(Untitled Form)', 'jetpack-forms' ),
			value: String( form.id ),
		} ) ),
	];

	if ( isLoading ) {
		return (
			<div style={ { padding: '12px 0' } }>
				<Spinner />
				<span style={ { marginLeft: '8px' } }>{ __( 'Loading forms…', 'jetpack-forms' ) }</span>
			</div>
		);
	}

	return (
		<div className="jetpack-form-selector">
			{ error && (
				<Notice status="error" isDismissible={ false }>
					{ error }
				</Notice>
			) }

			<SelectControl
				label={ __( 'Select Form', 'jetpack-forms' ) }
				value={ String( formRef ) }
				options={ formOptions }
				onChange={ handleFormChange }
				help={ __(
					'Choose an existing form or create a new one. Forms can be reused across multiple posts and pages.',
					'jetpack-forms'
				) }
				disabled={ isLoading || isCreatingNew }
			/>

			<Button
				variant="secondary"
				onClick={ handleCreateNew }
				disabled={ isCreatingNew }
				style={ { marginTop: '8px' } }
			>
				{ isCreatingNew ? (
					<>
						<Spinner />
						{ __( 'Creating…', 'jetpack-forms' ) }
					</>
				) : (
					__( 'Create New Form', 'jetpack-forms' )
				) }
			</Button>

			{ formRef > 0 && (
				<div style={ { marginTop: '12px' } }>
					<TextControl
						label={ __( 'Form Title', 'jetpack-forms' ) }
						value={ formTitle }
						onChange={ handleTitleChange }
						placeholder={ __( 'Enter form title', 'jetpack-forms' ) }
						help={
							isSavingTitle
								? __( 'Saving…', 'jetpack-forms' )
								: __( 'Give your form a descriptive name.', 'jetpack-forms' )
						}
						__nextHasNoMarginBottom={ true }
					/>
					<div
						style={ {
							marginTop: '8px',
							fontSize: '12px',
							color: '#757575',
						} }
					>
						<small>
							{ __( 'Form ID:', 'jetpack-forms' ) } { formRef }
						</small>
					</div>
				</div>
			) }

			{ forms.length === 0 && ! isLoading && (
				<Notice status="info" isDismissible={ false }>
					{ __( 'No forms found. Create your first form!', 'jetpack-forms' ) }
				</Notice>
			) }
		</div>
	);
}
