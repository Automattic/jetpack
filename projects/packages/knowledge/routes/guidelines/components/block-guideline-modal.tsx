import {
	Button,
	ComboboxControl,
	Modal,
	Notice,
	TextControl,
	TextareaControl as WCTextareaControl,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalConfirmDialog as ConfirmDialog,
} from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { blockSlug, saveGuidelineRow, deleteGuidelineRow } from '../data';
import type { ContentBlock, GuidelineRow, GuidelineQuery } from '../types';
import './block-guideline-modal.scss';

interface BlockGuidelineModalProps {
	closeModal: () => void;
	initialBlock?: string;
	contentBlocks: ContentBlock[];
	bySlug: Record< string, GuidelineRow >;
	query: GuidelineQuery;
	onRemoved?: () => void;
}

export default function BlockGuidelineModal( {
	closeModal,
	initialBlock,
	contentBlocks,
	bySlug,
	query,
	onRemoved,
}: BlockGuidelineModalProps ) {
	const [ selectedBlock, setSelectedBlock ] = useState< string | undefined >( initialBlock );

	const [ isSaving, setIsSaving ] = useState( false );
	const [ error, setError ] = useState< string | null >( null );
	const [ showRemoveConfirmation, setShowRemoveConfirmation ] = useState( false );

	const isEditing = !! initialBlock;

	const currentGuideline = selectedBlock
		? ( bySlug[ blockSlug( selectedBlock ) ]?.content ?? '' )
		: '';
	const [ guidelineText, setGuidelineText ] = useState( currentGuideline );

	const availableBlockOptions = useMemo( () => {
		return contentBlocks
			.filter( block => ! bySlug[ blockSlug( block.name ) ] || block.name === selectedBlock )
			.filter( block => block.name !== initialBlock )
			.map( block => ( {
				value: block.name,
				label: block.title,
			} ) );
	}, [ contentBlocks, bySlug, initialBlock, selectedBlock ] );

	const selectedBlockLabel = useMemo(
		() => contentBlocks.find( block => block.name === selectedBlock )?.title || '',
		[ contentBlocks, selectedBlock ]
	);

	const { createSuccessNotice } = useDispatch( noticesStore );

	const handleSave = ( value: string ) => {
		value = value.trim();
		if ( ! selectedBlock ) {
			return;
		}

		setIsSaving( true );
		const slug = blockSlug( selectedBlock );
		const existingId = bySlug[ slug ]?.id;

		let operation: Promise< void >;
		if ( value ) {
			operation = saveGuidelineRow( slug, selectedBlock, value, existingId, query );
		} else if ( existingId ) {
			operation = deleteGuidelineRow( existingId );
		} else {
			operation = Promise.resolve();
		}

		operation
			.then( () => {
				setError( null );
				createSuccessNotice(
					value
						? __( 'Guideline saved.', 'jetpack-knowledge' )
						: __( 'Guideline removed.', 'jetpack-knowledge' ),
					{
						type: 'snackbar',
					}
				);
				if ( ! value && existingId ) {
					onRemoved?.();
				}
				closeModal();
			} )
			.catch( ( e: Error ) => setError( e.message ) )
			.finally( () => setIsSaving( false ) );
	};

	const canSubmit = selectedBlock && guidelineText.trim().length > 0;

	let submitButtonLabel: string = __( 'Save', 'jetpack-knowledge' );
	if ( isSaving ) {
		submitButtonLabel = __( 'Saving…', 'jetpack-knowledge' );
	}

	return (
		<Modal
			className="block-guideline-modal"
			title={
				isEditing
					? __( 'Edit guideline', 'jetpack-knowledge' )
					: __( 'Add guideline', 'jetpack-knowledge' )
			}
			onRequestClose={ closeModal }
		>
			<VStack spacing={ 4 }>
				{ isEditing ? (
					<TextControl
						label={ __( 'Block', 'jetpack-knowledge' ) }
						value={ selectedBlockLabel }
						onChange={ () => {} }
						disabled
					/>
				) : (
					<ComboboxControl
						label={ __( 'Block', 'jetpack-knowledge' ) }
						options={ availableBlockOptions }
						value={ selectedBlock }
						onChange={ value => setSelectedBlock( value ?? undefined ) }
						placeholder={ __( 'Search for a block…', 'jetpack-knowledge' ) }
					/>
				) }
				<WCTextareaControl
					label={ __( 'Guideline text', 'jetpack-knowledge' ) }
					value={ guidelineText }
					onChange={ setGuidelineText }
					placeholder={ __(
						'Enter guidelines for how this block should be used…',
						'jetpack-knowledge'
					) }
					rows={ 6 }
				/>
				{ error && (
					<Notice status="error" onRemove={ () => setError( null ) }>
						{ sprintf(
							/* translators: %s: Error message. */
							__( 'Error: %s', 'jetpack-knowledge' ),
							error
						) }
					</Notice>
				) }
				<HStack justify="flex-end" spacing={ 2 } className="block-guideline-modal__actions">
					{ isEditing && (
						<Button
							variant="tertiary"
							isDestructive
							onClick={ () => setShowRemoveConfirmation( true ) }
							disabled={ isSaving }
							accessibleWhenDisabled
							type="button"
							__next40pxDefaultSize
						>
							{ __( 'Remove', 'jetpack-knowledge' ) }
						</Button>
					) }
					<Button
						variant="primary"
						onClick={ () => handleSave( guidelineText ) }
						disabled={ ! canSubmit || isSaving }
						isBusy={ isSaving }
						accessibleWhenDisabled
						__next40pxDefaultSize
					>
						{ submitButtonLabel }
					</Button>
				</HStack>
			</VStack>
			<ConfirmDialog
				isOpen={ showRemoveConfirmation }
				title={ __( 'Remove block guideline', 'jetpack-knowledge' ) }
				__experimentalHideHeader={ false }
				onConfirm={ () => {
					handleSave( '' );
					setShowRemoveConfirmation( false );
				} }
				onCancel={ () => setShowRemoveConfirmation( false ) }
				confirmButtonText={ __( 'Remove', 'jetpack-knowledge' ) }
				isBusy={ isSaving }
				size="small"
			>
				{ sprintf(
					/* translators: %s: Block name. */
					__(
						'You are about to remove the block guideline for the %s block.',
						'jetpack-knowledge'
					),
					selectedBlockLabel
				) }
			</ConfirmDialog>
		</Modal>
	);
}
