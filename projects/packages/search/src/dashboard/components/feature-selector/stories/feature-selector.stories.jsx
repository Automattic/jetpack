import { createReduxStore, createRegistry, RegistryProvider } from '@wordpress/data';
import { action } from 'storybook/actions';
import { storeConfig, STORE_ID } from '../../../store';
import { EXPERIENCE } from '../constants';
import FeatureSelector from '../index';

export default {
	title: 'Packages/Search/FeatureSelector',
	component: FeatureSelector,
	parameters: {
		layout: 'centered',
	},
	decorators: [
		Story => (
			<div style={ { width: 900 } }>
				<Story />
			</div>
		),
	],
};

const saveExperienceAction = action( 'saveExperience' );
const setPendingExperienceAction = action( 'setPendingExperience' );

const createStoreWithSettings = ( jetpackSettings, sitePlan = {}, siteData = {} ) => {
	const registry = createRegistry();
	const store = createReduxStore( STORE_ID, {
		...storeConfig,
		actions: {
			...storeConfig.actions,
			// Capture saves to the Storybook Actions panel instead of running the
			// real generator, which would record analytics and hit the WP REST API.
			saveExperience: experience => {
				saveExperienceAction( experience );
				return { type: 'STORYBOOK_NOOP' };
			},
			// Log the radio-row change, then delegate to the real action so the
			// reducer still updates `pending_experience` and the row visibly
			// selects / un-disables the Save button.
			setPendingExperience: experience => {
				setPendingExperienceAction( experience );
				return storeConfig.actions.setPendingExperience( experience );
			},
		},
		initialState: {
			...( storeConfig.initialState || {} ),
			jetpackSettings,
			sitePlan,
			siteData,
		},
	} );
	registry.register( store );
	return registry;
};

// Clean state - Save button is aria-disabled (no changes made)
export const Clean = () => {
	const settings = {
		module_active: true,
		instant_search_enabled: true,
		pending_experience: null,
		experience: EXPERIENCE.OVERLAY,
		is_updating: false,
	};
	const registry = createStoreWithSettings( settings );
	return (
		<RegistryProvider value={ registry }>
			<FeatureSelector />
		</RegistryProvider>
	);
};

// Dirty state - Save button enabled (user selected a different experience)
export const Dirty = () => {
	const settings = {
		module_active: true,
		instant_search_enabled: true,
		pending_experience: EXPERIENCE.INLINE,
		experience: EXPERIENCE.OVERLAY,
		is_updating: false,
	};
	const registry = createStoreWithSettings( settings );
	return (
		<RegistryProvider value={ registry }>
			<FeatureSelector />
		</RegistryProvider>
	);
};

// Saving state - Save button shows loading spinner
export const Saving = () => {
	const settings = {
		module_active: true,
		instant_search_enabled: true,
		pending_experience: EXPERIENCE.INLINE,
		experience: EXPERIENCE.OVERLAY,
		is_updating: true,
	};
	const registry = createStoreWithSettings( settings );
	return (
		<RegistryProvider value={ registry }>
			<FeatureSelector />
		</RegistryProvider>
	);
};

// Classic-only plan - Embedded and Overlay rows are disabled
export const ClassicOnlyPlan = () => {
	const settings = {
		module_active: true,
		instant_search_enabled: false,
		pending_experience: null,
		experience: EXPERIENCE.INLINE,
		is_updating: false,
	};
	const sitePlan = {
		supports_only_classic_search: true,
	};
	const registry = createStoreWithSettings( settings, sitePlan );
	return (
		<RegistryProvider value={ registry }>
			<FeatureSelector />
		</RegistryProvider>
	);
};

// Embedded experience active
export const EmbeddedActive = () => {
	const settings = {
		module_active: true,
		instant_search_enabled: true,
		pending_experience: null,
		experience: EXPERIENCE.EMBEDDED,
		is_updating: false,
	};
	const registry = createStoreWithSettings( settings );
	return (
		<RegistryProvider value={ registry }>
			<FeatureSelector />
		</RegistryProvider>
	);
};

// Overlay experience active
export const OverlayActive = () => {
	const settings = {
		module_active: true,
		instant_search_enabled: true,
		pending_experience: null,
		experience: EXPERIENCE.OVERLAY,
		is_updating: false,
	};
	const registry = createStoreWithSettings( settings );
	return (
		<RegistryProvider value={ registry }>
			<FeatureSelector />
		</RegistryProvider>
	);
};

// Theme search (inline) experience active
export const InlineActive = () => {
	const settings = {
		module_active: true,
		instant_search_enabled: false,
		pending_experience: null,
		experience: EXPERIENCE.INLINE,
		is_updating: false,
	};
	const registry = createStoreWithSettings( settings );
	return (
		<RegistryProvider value={ registry }>
			<FeatureSelector />
		</RegistryProvider>
	);
};

// Off experience active
export const OffActive = () => {
	const settings = {
		module_active: false,
		instant_search_enabled: false,
		pending_experience: null,
		experience: EXPERIENCE.OFF,
		is_updating: false,
	};
	const registry = createStoreWithSettings( settings );
	return (
		<RegistryProvider value={ registry }>
			<FeatureSelector />
		</RegistryProvider>
	);
};

// WordPress.com site - Off option is hidden
export const WpcomSite = () => {
	const settings = {
		module_active: true,
		instant_search_enabled: true,
		pending_experience: null,
		experience: EXPERIENCE.OVERLAY,
		is_updating: false,
	};
	const siteData = {
		isWpcom: true,
	};
	const registry = createStoreWithSettings( settings, {}, siteData );
	return (
		<RegistryProvider value={ registry }>
			<FeatureSelector />
		</RegistryProvider>
	);
};
