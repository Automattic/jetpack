import {
	Button,
	Notice,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	__experimentalConfirmDialog as ConfirmDialog,
} from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { DataForm } from '@wordpress/dataviews';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { scopeSlug, saveGuidelineRow, deleteGuidelineRow } from '../data';
import type { Scope, GuidelineQuery } from '../types';
import type { Field, Form } from '@wordpress/dataviews';

interface GuidelineAccordionFormProps {
	scope: Scope;
	existingId: number | undefined;
	content: string;
	query: GuidelineQuery;
}

export default function GuidelineAccordionForm( {
	scope,
	existingId,
	content,
	query,
}: GuidelineAccordionFormProps ) {
	const { createSuccessNotice } = useDispatch( noticesStore );
	const [ loading, setLoading ] = useState( false );
	const [ error, setError ] = useState< string | null >( null );
	const [ showClearConfirmation, setShowClearConfirmation ] = useState( false );

	const [ draft, setDraft ] = useState( content );
	useEffect( () => setDraft( content ), [ content ] );

	const data = useMemo( () => ( { guidelines: draft } ), [ draft ] );

	const fields: Field< { guidelines: string } >[] = useMemo(
		() => [
			{
				id: 'guidelines',
				label: sprintf(
					/* translators: %s: Guideline section title. */
					__( '%s guidelines', 'jetpack-knowledge' ),
					scope.title
				),
				type: 'text',
				Edit: 'textarea',
			},
		],
		[ scope.title ]
	);

	const form: Form = useMemo(
		() => ( {
			layout: { type: 'regular', labelPosition: 'top' },
			fields: [ 'guidelines' ],
		} ),
		[]
	);

	const handleSave = ( event: React.FormEvent< HTMLFormElement > ) => {
		event.preventDefault();
		setLoading( true );
		saveGuidelineRow( scopeSlug( scope.slug ), scope.title, draft, existingId, query )
			.then( () => {
				setError( null );
				createSuccessNotice( __( 'Guidelines saved.', 'jetpack-knowledge' ), {
					type: 'snackbar',
				} );
			} )
			.catch( ( e: Error ) =>
				setError(
					sprintf(
						/* translators: %s: Error message. */
						__( 'Error saving guidelines: %s', 'jetpack-knowledge' ),
						e.message
					)
				)
			)
			.finally( () => setLoading( false ) );
	};

	const handleClearClick = () => setShowClearConfirmation( true );

	const handleClearConfirm = () => {
		if ( ! existingId ) {
			setShowClearConfirmation( false );
			return;
		}
		setLoading( true );
		deleteGuidelineRow( existingId )
			.then( () => {
				setError( null );
				createSuccessNotice( __( 'Guidelines cleared.', 'jetpack-knowledge' ), {
					type: 'snackbar',
				} );
			} )
			.catch( ( e: Error ) =>
				setError(
					sprintf(
						/* translators: %s: Error message. */
						__( 'Error clearing guidelines: %s', 'jetpack-knowledge' ),
						e.message
					)
				)
			)
			.finally( () => {
				setLoading( false );
				setShowClearConfirmation( false );
			} );
	};

	return (
		<form onSubmit={ handleSave }>
			<VStack spacing={ 4 }>
				<DataForm
					data={ data }
					fields={ fields }
					form={ form }
					onChange={ edits => setDraft( edits.guidelines ?? draft ) }
				/>
				{ error && (
					<Notice status="error" onRemove={ () => setError( null ) }>
						{ error }
					</Notice>
				) }
				<HStack spacing={ 4 } alignment="right">
					<Button
						variant="tertiary"
						type="button"
						disabled={ loading || ! existingId }
						accessibleWhenDisabled
						isBusy={ loading }
						onClick={ handleClearClick }
						__next40pxDefaultSize
					>
						{ __( 'Clear', 'jetpack-knowledge' ) }
					</Button>
					<Button
						variant="primary"
						type="submit"
						disabled={ loading || ! draft }
						accessibleWhenDisabled
						isBusy={ loading }
						__next40pxDefaultSize
					>
						{ __( 'Save', 'jetpack-knowledge' ) }
					</Button>
				</HStack>
			</VStack>
			<ConfirmDialog
				isOpen={ showClearConfirmation }
				title={ sprintf(
					/* translators: %s: Guideline section title. */
					__( 'Clear %s guideline', 'jetpack-knowledge' ),
					scope.title
				) }
				__experimentalHideHeader={ false }
				onConfirm={ handleClearConfirm }
				onCancel={ () => setShowClearConfirmation( false ) }
				confirmButtonText={ __( 'Clear', 'jetpack-knowledge' ) }
				isBusy={ loading }
				size="small"
			>
				{ sprintf(
					/* translators: %s: Guideline section title. */
					__( 'You are about to clear the %s guideline.', 'jetpack-knowledge' ),
					scope.title
				) }
			</ConfirmDialog>
		</form>
	);
}
