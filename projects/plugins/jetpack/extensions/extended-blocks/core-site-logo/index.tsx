/*
 * External dependencies
 */
import { GeneratorModal } from '@automattic/jetpack-ai-client';
import { BlockControls } from '@wordpress/block-editor';
import { getBlockType } from '@wordpress/blocks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useDispatch, useSelect, select } from '@wordpress/data';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
/*
 * Internal dependencies
 */
import { getFeatureAvailability } from '../../blocks/ai-assistant/lib/utils/get-feature-availability';
import AiToolbarButton from './components/ai-toolbar-button.js';
import { SITE_LOGO_BLOCK_AI_EXTENSION, TOOL_PLACEMENT, PLACEMENT_CONTEXT } from './constants.js';

/**
 * Mininal type definition for the core select function.
 */
type CoreSelect = {
	getEntityRecord: (
		kind: string,
		name: string
	) => {
		url: string;
		title: string;
		description: string;
	};
};

/**
 * Hook to set the site logo on the local state, affecting the logo block.
 *
 * @return {object} An object with the setLogo function.
 */
const useSetLogo = () => {
	const editEntityRecord = useDispatch( 'core' ).editEntityRecord;
	const saveLogo = useCallback(
		( mediaId: number ) => {
			editEntityRecord( 'root', 'site', undefined, {
				site_logo: mediaId,
			} );
		},
		[ editEntityRecord ]
	);

	const saveIcon = useCallback(
		( mediaId: number ) => {
			editEntityRecord( 'root', 'site', undefined, {
				site_icon: mediaId,
			} );
		},
		[ editEntityRecord ]
	);

	const setLogo = useCallback(
		( mediaId: number, updateIcon: boolean ) => {
			saveLogo( mediaId );
			if ( updateIcon ) {
				saveIcon( mediaId );
			}
		},
		[ saveLogo, saveIcon ]
	);

	return {
		setLogo,
	};
};

const useSiteDetails = () => {
	const siteSettings = useSelect( selectData => {
		return ( selectData( 'core' ) as CoreSelect ).getEntityRecord( 'root', 'site' );
	}, [] );

	return {
		ID: parseInt( window?.Jetpack_Editor_Initial_State?.wpcomBlogId ),
		URL: siteSettings?.url,
		domain: window?.Jetpack_Editor_Initial_State?.siteFragment,
		name: siteSettings?.title,
		description: siteSettings?.description,
	};
};

/**
 * HOC to add the AI button on the Site Logo toolbar.
 */
const siteLogoEditWithAiComponents = createHigherOrderComponent( BlockEdit => {
	return props => {
		const [ isLogoGeneratorModalVisible, setIsLogoGeneratorModalVisible ] = useState( false );
		const { setLogo } = useSetLogo();
		const shouldSyncIcon = props?.attributes?.shouldSyncIcon || false;

		const showModal = useCallback( () => {
			setIsLogoGeneratorModalVisible( true );
		}, [] );

		const closeModal = useCallback( () => {
			setIsLogoGeneratorModalVisible( false );
		}, [] );

		const reloadModal = useCallback( () => {
			closeModal();
			showModal();
		}, [ closeModal, showModal ] );

		const applyLogoHandler = useCallback(
			( mediaId: number ) => {
				if ( mediaId ) {
					setLogo( mediaId, shouldSyncIcon );
				}
			},
			[ setLogo, shouldSyncIcon ]
		);

		useEffect( () => {
			return () => {
				// close modal if open when the component unmounts
				closeModal();
			};
		}, [ closeModal ] );

		const siteDetails = useSiteDetails();

		return (
			<>
				<BlockEdit { ...props } />
				<BlockControls group="block">
					<AiToolbarButton clickHandler={ showModal } />
				</BlockControls>
				<GeneratorModal
					isOpen={ isLogoGeneratorModalVisible }
					onClose={ closeModal }
					onApplyLogo={ applyLogoHandler }
					onReload={ reloadModal }
					context={ PLACEMENT_CONTEXT }
					placement={ TOOL_PLACEMENT }
					siteDetails={ siteDetails }
				/>
			</>
		);
	};
}, 'SiteLogoEditWithAiComponents' );

/**
 * Function to check if the feature is available depending on the site ID.
 *
 * @return {boolean} True if the feature is available.
 */
function isFeatureAvailable() {
	return getFeatureAvailability( SITE_LOGO_BLOCK_AI_EXTENSION );
}

/**
 * Function to check if the block can be extended.
 *
 * @param {string} name - The block name.
 * @return {boolean} True if the block can be extended.
 */
function canExtendBlock( name: string ): boolean {
	if ( name !== 'core/site-logo' ) {
		return false;
	}

	// Check if the AI Assistant block is registered. If not, we understand that Jetpack AI is not active.
	const isAIAssistantBlockRegistered = getBlockType( 'jetpack/ai-assistant' );

	if ( ! isAIAssistantBlockRegistered ) {
		return false;
	}

	// Disable if the feature is not available.
	if ( ! isFeatureAvailable() ) {
		return false;
	}

	/*
	 * Do not extend if the AI Assistant block is hidden,
	 * as a way for the user to hide the extension.
	 * TODO: the `editPostStore` is undefined for P2 sites.
	 * Let's find a way to check if the block is hidden there.
	 */
	const { getHiddenBlockTypes } = select( 'core/edit-post' ) || {};
	const hiddenBlocks = getHiddenBlockTypes?.() || []; // It will extend the block if the function is undefined

	if ( hiddenBlocks.includes( 'jetpack/ai-assistant' ) ) {
		return false;
	}

	return true;
}

/**
 * Function to override the core Site Logo block edit settings.
 * Will create a HOC to use as the edit implementation.
 *
 * @param {object} settings - The block settings.
 * @param {string} name     - The block name.
 * @return {object} The new block settings.
 */
function jetpackSiteLogoWithAiSupport( settings, name: string ) {
	if ( ! canExtendBlock( name ) ) {
		return settings;
	}

	return {
		...settings,
		edit: siteLogoEditWithAiComponents( settings.edit ),
	};
}

addFilter(
	'blocks.registerBlockType',
	'jetpack/site-logo-with-ai-support',
	jetpackSiteLogoWithAiSupport,
	100
);
