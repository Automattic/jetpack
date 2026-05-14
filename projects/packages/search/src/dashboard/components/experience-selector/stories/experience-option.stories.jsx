import { createReduxStore, createRegistry, RegistryProvider } from '@wordpress/data';
import { action } from 'storybook/actions';
import { storeConfig, STORE_ID } from '../../../store';
import { EXPERIENCE, EXPERIENCE_ORDER, getExperienceLabel } from '../constants';
import ExperienceOption from '../experience-option';

const experienceLabels = Object.fromEntries(
	EXPERIENCE_ORDER.map( experience => [ experience, getExperienceLabel( experience ) ] )
);

const setPendingExperienceAction = action( 'setPendingExperience' );

export default {
	title: 'Packages/Search/ExperienceSelector/ExperienceOption',
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
			options: EXPERIENCE_ORDER,
			labels: experienceLabels,
		},
		disabled: {
			control: 'boolean',
		},
		pendingExperience: {
			control: 'select',
			options: EXPERIENCE_ORDER,
			labels: experienceLabels,
		},
		activeExperience: {
			control: 'select',
			options: EXPERIENCE_ORDER,
			labels: experienceLabels,
		},
	},
};

const createStoreWithSettings = jetpackSettings => {
	const registry = createRegistry();
	const store = createReduxStore( STORE_ID, {
		...storeConfig,
		actions: {
			...storeConfig.actions,
			// Log the radio-row change, then delegate to the real action so the
			// reducer still updates `pending_experience` and the row visibly
			// selects.
			setPendingExperience: experience => {
				setPendingExperienceAction( experience );
				return storeConfig.actions.setPendingExperience( experience );
			},
		},
		initialState: { ...( storeConfig.initialState || {} ), jetpackSettings },
	} );
	registry.register( store );
	return registry;
};

// Pick a default `active` that won't accidentally match the rendered row,
// so baseline stories render as unselected/inactive unless `activeExperience`
// is set explicitly. Without this, the legacy boolean fallback in the
// `getActiveExperience` selector derives `'overlay'` from
// `instant_search_enabled: true` and contaminates every Overlay story.
const defaultActiveFor = experience =>
	experience === EXPERIENCE.EMBEDDED ? EXPERIENCE.INLINE : EXPERIENCE.EMBEDDED;

const Template = args => {
	const baseSettings = {
		module_active: true,
		instant_search_enabled: true,
		pending_experience: args.pendingExperience ?? null,
		experience: args.activeExperience ?? defaultActiveFor( args.experience ),
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
