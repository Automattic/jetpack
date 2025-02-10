import { PagePatternModal, PatternDefinition } from '@automattic/page-pattern-modal';
import { BlockInstance } from '@wordpress/blocks';
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { addFilter, removeFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { pageLayoutStore } from './store';

const INSERTING_HOOK_NAME = 'isInsertingPagePattern';
const INSERTING_HOOK_NAMESPACE = 'automattic/full-site-editing/inserting-pattern';

interface PagePatternsPluginProps {
	patterns: PatternDefinition[];
}
type CoreBlockEditorPlaceholder = {
	getBlocks: ( ...args: unknown[] ) => BlockInstance[];
};
type CoreEditorPlaceholder = {
	getEditedPostAttribute: ( ...args: unknown[] ) => unknown;
};
type CoreEditPostPlaceholder = {
	isFeatureActive: ( ...args: unknown[] ) => boolean;
};

/**
 * Recursively finds the Content block if any.
 *
 * @param blocks - The current blocks
 * @return Block found, if any
 */
function findPostContentBlock( blocks: BlockInstance[] ): BlockInstance | null {
	for ( const block of blocks ) {
		if ( block.name === 'core/post-content' || block.name === 'a8c/post-content' ) {
			return block;
		}
		const result = findPostContentBlock( block.innerBlocks );
		if ( result ) {
			return result;
		}
	}
	return null;
}

/**
 * Starter page templates feature plugin
 *
 * @param  props - An object that receives the page patterns
 * @return {JSX.Element} The rendered page pattern modal component.
 */
export function PagePatternsPlugin( props: PagePatternsPluginProps ): JSX.Element {
	const { setOpenState } = useDispatch( pageLayoutStore );
	const { setUsedPageOrPatternsModal } = useDispatch( 'automattic/wpcom-welcome-guide' );
	const { replaceInnerBlocks } = useDispatch( 'core/block-editor' );
	const { editPost } = useDispatch( 'core/editor' );
	const { toggleFeature } = useDispatch( 'core/edit-post' );

	const selectProps = useSelect( select => {
		const getMetaNew = () =>
			( select( 'core/editor' ) as CoreEditorPlaceholder ).getEditedPostAttribute( 'meta' );
		const currentBlocks = (
			select( 'core/block-editor' ) as CoreBlockEditorPlaceholder
		 ).getBlocks();
		const { isOpen, isPatternPicker } = select( pageLayoutStore );
		return {
			getMeta: getMetaNew,
			postContentBlock: findPostContentBlock( currentBlocks ),
			isOpen: isOpen(),
			isWelcomeGuideActive: (
				select( 'core/edit-post' ) as CoreEditPostPlaceholder
			 ).isFeatureActive( 'welcomeGuide' ) as boolean,
			...( isPatternPicker() && {
				title: __( 'Choose a Pattern', 'jetpack-mu-wpcom' ),
				description: __(
					'Pick a pre-defined layout or continue with a blank page',
					'jetpack-mu-wpcom'
				),
			} ),
		};
	}, [] );

	const { getMeta, postContentBlock } = selectProps;

	const savePatternChoice = useCallback(
		( name: string, selectedCategory: string | null ) => {
			// Save selected pattern slug in meta.
			const currentMeta = getMeta() as Record< string, unknown >;
			const currentCategory =
				( Array.isArray( currentMeta._wpcom_template_layout_category ) &&
					currentMeta._wpcom_template_layout_category ) ||
				[];
			editPost( {
				meta: {
					...currentMeta,
					_starter_page_template: name,
					_wpcom_template_layout_category: [ ...currentCategory, selectedCategory ],
				},
			} );
		},
		[ editPost, getMeta ]
	);

	const insertPattern = useCallback(
		( title: string | null, blocks: unknown[] ) => {
			// Add filter to let the tracking library know we are inserting a template.
			addFilter( INSERTING_HOOK_NAME, INSERTING_HOOK_NAMESPACE, () => true );

			// Set post title.
			if ( title ) {
				editPost( { title } );
			}

			// Replace blocks.
			replaceInnerBlocks( postContentBlock ? postContentBlock.clientId : '', blocks, false );

			// Remove filter.
			removeFilter( INSERTING_HOOK_NAME, INSERTING_HOOK_NAMESPACE );
		},
		[ editPost, postContentBlock, replaceInnerBlocks ]
	);

	const { isWelcomeGuideActive } = selectProps;

	const hideWelcomeGuide = useCallback( () => {
		if ( isWelcomeGuideActive ) {
			toggleFeature( 'welcomeGuide' );
		}
	}, [ isWelcomeGuideActive, toggleFeature ] );

	const handleClose = useCallback( () => {
		setOpenState( 'CLOSED' );
		setUsedPageOrPatternsModal?.();
	}, [ setOpenState, setUsedPageOrPatternsModal ] );

	return (
		<PagePatternModal
			{ ...selectProps }
			onClose={ handleClose }
			savePatternChoice={ savePatternChoice }
			insertPattern={ insertPattern }
			hideWelcomeGuide={ hideWelcomeGuide }
			{ ...props }
		/>
	);
}
