/*
 * External dependencies
 */
import { GeneratorModal } from '@automattic/jetpack-ai-client';
import { BlockControls } from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
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
 * @returns {object} An object with the setLogo function.
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
	const siteSettings = useSelect( select => {
		return ( select( 'core' ) as CoreSelect ).getEntityRecord( 'root', 'site' );
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
					context={ PLACEMENT_CONTEXT }
					placement={ TOOL_PLACEMENT }
					siteDetails={ siteDetails }
				/>
			</>
		);
	};
}, 'SiteLogoEditWithAiComponents' );

/**
 * Function to override the core Site Logo block edit settings.
 * Will create a HOC to use as the edit implementation.
 *
 * @param {object} settings - The block settings.
 * @param {string} name - The block name.
 * @returns {object} The new block settings.
 */
function jetpackSiteLogoWithAiSupport( settings, name: string ) {
	// Only extend the core Site Logo block.
	if ( name !== 'core/site-logo' ) {
		return settings;
	}

	// Disable if the feature is not available.
	if ( ! getFeatureAvailability( SITE_LOGO_BLOCK_AI_EXTENSION ) ) {
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
