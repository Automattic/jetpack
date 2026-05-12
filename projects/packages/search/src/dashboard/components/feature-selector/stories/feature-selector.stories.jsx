import { createReduxStore, createRegistry, RegistryProvider } from '@wordpress/data';
import { action } from 'storybook/actions';
import { storeConfig, STORE_ID } from '../../../store';
import { EXPERIENCE } from '../constants';
import FeatureSelector from '../index';

export default {
	title: 'Packages/Search/FeatureSelector',
	component: FeatureSelector,
	parameters: {
		layout: 'padded',
	},
	argTypes: {
		isWpcom: {
			control: 'boolean',
			description: 'Seed `siteData.isWpcom` — hides the Off row.',
		},
		supportsOnlyClassicSearch: {
			control: 'boolean',
			description: 'Seed `sitePlan.supports_only_classic_search` — disables Embedded + Overlay.',
		},
	},
	args: {
		isWpcom: false,
		supportsOnlyClassicSearch: false,
	},
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
			// Default `supports_instant_search: true` so the Overlay card renders
			// both customization actions; stories override via the arg.
			sitePlan: { supports_instant_search: true, ...sitePlan },
			siteData,
		},
	} );
	registry.register( store );
	return registry;
};

const renderWithStoryArgs = ( settings, args ) => {
	const sitePlan = { supports_only_classic_search: args.supportsOnlyClassicSearch };
	const siteData = { isWpcom: args.isWpcom };
	const registry = createStoreWithSettings( settings, sitePlan, siteData );
	return (
		<RegistryProvider value={ registry }>
			<FeatureSelector />
		</RegistryProvider>
	);
};

// Clean state - Save button is aria-disabled (no changes made)
export const Clean = args =>
	renderWithStoryArgs(
		{
			module_active: true,
			instant_search_enabled: true,
			pending_experience: null,
			experience: EXPERIENCE.OVERLAY,
			is_updating: false,
		},
		args
	);

// Dirty state - Save button enabled (user selected a different experience)
export const Dirty = args =>
	renderWithStoryArgs(
		{
			module_active: true,
			instant_search_enabled: true,
			pending_experience: EXPERIENCE.INLINE,
			experience: EXPERIENCE.OVERLAY,
			is_updating: false,
		},
		args
	);

// Saving state - Save button shows loading spinner
export const Saving = args =>
	renderWithStoryArgs(
		{
			module_active: true,
			instant_search_enabled: true,
			pending_experience: EXPERIENCE.INLINE,
			experience: EXPERIENCE.OVERLAY,
			is_updating: true,
		},
		args
	);

// Classic-only plan - Embedded and Overlay rows are disabled
export const ClassicOnlyPlan = args =>
	renderWithStoryArgs(
		{
			module_active: true,
			instant_search_enabled: false,
			pending_experience: null,
			experience: EXPERIENCE.INLINE,
			is_updating: false,
		},
		args
	);
ClassicOnlyPlan.args = {
	supportsOnlyClassicSearch: true,
};

// Embedded experience active
export const EmbeddedActive = args =>
	renderWithStoryArgs(
		{
			module_active: true,
			instant_search_enabled: true,
			pending_experience: null,
			experience: EXPERIENCE.EMBEDDED,
			is_updating: false,
		},
		args
	);

// Overlay experience active
export const OverlayActive = args =>
	renderWithStoryArgs(
		{
			module_active: true,
			instant_search_enabled: true,
			pending_experience: null,
			experience: EXPERIENCE.OVERLAY,
			is_updating: false,
		},
		args
	);

// Theme search (inline) experience active
export const InlineActive = args =>
	renderWithStoryArgs(
		{
			module_active: true,
			instant_search_enabled: false,
			pending_experience: null,
			experience: EXPERIENCE.INLINE,
			is_updating: false,
		},
		args
	);

// Off experience active
export const OffActive = args =>
	renderWithStoryArgs(
		{
			module_active: false,
			instant_search_enabled: false,
			pending_experience: null,
			experience: EXPERIENCE.OFF,
			is_updating: false,
		},
		args
	);

// WordPress.com site - Off option is hidden
export const WpcomSite = args =>
	renderWithStoryArgs(
		{
			module_active: true,
			instant_search_enabled: true,
			pending_experience: null,
			experience: EXPERIENCE.OVERLAY,
			is_updating: false,
		},
		args
	);
WpcomSite.args = {
	isWpcom: true,
};
