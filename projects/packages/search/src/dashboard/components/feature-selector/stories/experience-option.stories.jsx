import { createReduxStore, createRegistry, RegistryProvider } from '@wordpress/data';
import ExperienceOption from '../experience-option';
import { storeConfig, STORE_ID } from '../../../store';
import { EXPERIENCE } from '../constants';

export default {
	title: 'Packages/Search/FeatureSelector/ExperienceOption',
	component: ExperienceOption,
	parameters: {
		layout: 'centered',
	},
	decorators: [
		Story => (
			<div style={ { width: 750 } }>
				<Story />
			</div>
		),
	],
	argTypes: {
		experience: {
			control: 'select',
			options: [ 'embedded', 'overlay', 'inline', 'off' ],
		},
		disabled: {
			control: 'boolean',
		},
	},
};

const createStoreWithSettings = jetpackSettings => {
	const registry = createRegistry();
	const store = createReduxStore( STORE_ID, {
		...storeConfig,
		initialState: { ...( storeConfig.initialState || {} ), jetpackSettings },
	} );
	registry.register( store );
	return registry;
};

const Template = args => {
	const baseSettings = {
		module_active: true,
		instant_search_enabled: true,
		pending_experience: args.pendingExperience || null,
		experience: args.activeExperience || null,
	};
	const registry = createStoreWithSettings( baseSettings );
	return (
		<RegistryProvider value={ registry }>
			<ExperienceOption experience={ args.experience } disabled={ args.disabled } />
		</RegistryProvider>
	);
};

// Embedded experience (default - shows RECOMMENDED badge)
export const Embedded = Template.bind( {} );
Embedded.args = {
	experience: EXPERIENCE.EMBEDDED,
	disabled: false,
	pendingExperience: null,
	activeExperience: null,
};

// Embedded selected
export const EmbeddedSelected = Template.bind( {} );
EmbeddedSelected.args = {
	experience: EXPERIENCE.EMBEDDED,
	disabled: false,
	pendingExperience: EXPERIENCE.EMBEDDED,
	activeExperience: null,
};

// Embedded active (shows ACTIVE badge)
export const EmbeddedActive = Template.bind( {} );
EmbeddedActive.args = {
	experience: EXPERIENCE.EMBEDDED,
	disabled: false,
	pendingExperience: null,
	activeExperience: EXPERIENCE.EMBEDDED,
};

// Overlay experience
export const Overlay = Template.bind( {} );
Overlay.args = {
	experience: EXPERIENCE.OVERLAY,
	disabled: false,
	pendingExperience: null,
	activeExperience: null,
};

// Overlay selected
export const OverlaySelected = Template.bind( {} );
OverlaySelected.args = {
	experience: EXPERIENCE.OVERLAY,
	disabled: false,
	pendingExperience: EXPERIENCE.OVERLAY,
	activeExperience: null,
};

// Overlay active (instant_search_enabled=true maps to overlay)
export const OverlayActive = Template.bind( {} );
OverlayActive.args = {
	experience: EXPERIENCE.OVERLAY,
	disabled: false,
	pendingExperience: null,
	activeExperience: EXPERIENCE.OVERLAY,
};

// Theme search (inline) experience
export const Inline = Template.bind( {} );
Inline.args = {
	experience: EXPERIENCE.INLINE,
	disabled: false,
	pendingExperience: null,
	activeExperience: null,
};

// Inline selected
export const InlineSelected = Template.bind( {} );
InlineSelected.args = {
	experience: EXPERIENCE.INLINE,
	disabled: false,
	pendingExperience: EXPERIENCE.INLINE,
	activeExperience: null,
};

// Inline active
export const InlineActive = Template.bind( {} );
InlineActive.args = {
	experience: EXPERIENCE.INLINE,
	disabled: false,
	pendingExperience: null,
	activeExperience: EXPERIENCE.INLINE,
};

// Off experience
export const Off = Template.bind( {} );
Off.args = {
	experience: EXPERIENCE.OFF,
	disabled: false,
	pendingExperience: null,
	activeExperience: null,
};

// Off selected
export const OffSelected = Template.bind( {} );
OffSelected.args = {
	experience: EXPERIENCE.OFF,
	disabled: false,
	pendingExperience: EXPERIENCE.OFF,
	activeExperience: null,
};

// Off active
export const OffActive = Template.bind( {} );
OffActive.args = {
	experience: EXPERIENCE.OFF,
	disabled: false,
	pendingExperience: null,
	activeExperience: EXPERIENCE.OFF,
};

// Disabled experience (shows upgrade tooltip)
export const Disabled = Template.bind( {} );
Disabled.args = {
	experience: EXPERIENCE.EMBEDDED,
	disabled: true,
	pendingExperience: null,
	activeExperience: null,
};

// Unselected state
export const Unselected = Template.bind( {} );
Unselected.args = {
	experience: EXPERIENCE.INLINE,
	disabled: false,
	pendingExperience: EXPERIENCE.EMBEDDED,
	activeExperience: null,
};
