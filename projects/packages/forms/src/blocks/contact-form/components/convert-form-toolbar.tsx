/**
 * Convert Form Toolbar Component
 * Provides toolbar buttons to convert forms to synced mode and edit synced forms
 */

import { store as blockEditorStore } from '@wordpress/block-editor';
import { ToolbarGroup, ToolbarButton } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { createSyncedForm } from '../util/create-synced-form.ts';
import { getEditorContext } from '../util/get-editor-context.ts';
import { navigateToForm } from '../util/navigate-to-form.ts';

const FORM_CONVERSION_LOCK = 'jetpack-form-conversion';

interface ConvertFormToolbarProps {
	clientId: string;
	attributes: Record< string, unknown >;
	/**
	 * Optional callback to run before navigating to form editor.
	 * Use this to stage any pending edits in the entity store (not save to database).
	 */
	onBeforeNavigate?: () => void;
}

/**
 * Toolbar component for converting inline forms to synced forms and editing synced forms.
 *
 * @param props                  - Component props.
 * @param props.clientId         - The block client ID.
 * @param props.attributes       - The block attributes.
 * @param props.onBeforeNavigate - Callback to stage pending edits before navigation.
 * @return Toolbar with edit/convert buttons.
 */
export function ConvertFormToolbar( {
	clientId,
	attributes,
	onBeforeNavigate,
}: ConvertFormToolbarProps ) {
	const editorContext = getEditorContext();
	const isWidgetEditor = editorContext === 'widget';

	const { block, formTitle, currentPostId, isLocked, onNavigateToEntityRecord } = useSelect(
		select => {
			const { getBlock, getSettings } = select( blockEditorStore );

			// Get widget area name in widget editor context
			let widgetAreaName = null;
			if ( isWidgetEditor ) {
				try {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					const widgetStore = select( 'core/edit-widgets' ) as any;
					widgetAreaName = widgetStore?.getParentWidgetAreaBlock?.( clientId )?.attributes?.name;
				} catch {
					// Widget store not available
				}
			}

			// In widget editor, we don't have post context
			const postTitle = isWidgetEditor
				? null
				: select( editorStore ).getEditedPostAttribute( 'title' );
			const postId = isWidgetEditor ? 0 : select( editorStore ).getEditedPostAttribute( 'id' );
			const locked = isWidgetEditor ? false : select( editorStore ).isPostSavingLocked();

			return {
				block: getBlock( clientId ),
				formTitle: widgetAreaName || postTitle || 'Untitled',
				currentPostId: postId,
				isLocked: locked,
				onNavigateToEntityRecord: getSettings().onNavigateToEntityRecord,
			};
		},
		[ clientId, isWidgetEditor ]
	);

	const { replaceInnerBlocks, updateBlockAttributes } = useDispatch( blockEditorStore );
	const { lockPostSaving, unlockPostSaving } = useDispatch( editorStore );
	const { createErrorNotice } = useDispatch( noticesStore );

	const hasRef = !! attributes.ref;

	const convertToSynced = async () => {
		if ( ! block || isLocked ) {
			return;
		}

		lockPostSaving?.( FORM_CONVERSION_LOCK );

		try {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { ref, ...cleanAttributes } = attributes;

			const formId = await createSyncedForm(
				{ attributes: cleanAttributes, innerBlocks: block.innerBlocks || [] },
				formTitle,
				currentPostId
			);

			// Clear block and set ref to the new form
			replaceInnerBlocks( clientId, [], false );
			const clearedAttributes = Object.keys( attributes ).reduce(
				( acc, key ) => {
					if ( key === 'ref' ) {
						return acc;
					}
					return { ...acc, [ key ]: undefined };
				},
				{ ref: formId }
			);
			updateBlockAttributes( clientId, clearedAttributes );

			navigateToForm( formId, editorContext, onNavigateToEntityRecord );
		} catch {
			createErrorNotice( __( 'Failed to create a form. Please try again.', 'jetpack-forms' ), {
				type: 'snackbar',
				isDismissible: true,
			} );
		} finally {
			unlockPostSaving?.( FORM_CONVERSION_LOCK );
		}
	};

	const handleEditOriginal = () => {
		if ( attributes.ref ) {
			// Stage any pending edits in the entity store before navigating
			onBeforeNavigate?.();
			navigateToForm( attributes.ref as number, editorContext, onNavigateToEntityRecord );
		}
	};

	return (
		<ToolbarGroup>
			{ hasRef ? (
				<ToolbarButton onClick={ handleEditOriginal }>
					{ __( 'Edit Form', 'jetpack-forms' ) }
				</ToolbarButton>
			) : (
				<ToolbarButton onClick={ convertToSynced } disabled={ isLocked }>
					{ __( 'Edit Form', 'jetpack-forms' ) }
				</ToolbarButton>
			) }
		</ToolbarGroup>
	);
}
