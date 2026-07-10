import type {
	LocalBusinessDefaults,
	LocalBusinessSettings,
	SchemaSettings,
} from '../../schema-settings-types';

export const EMPTY_LOCAL_BUSINESS: LocalBusinessSettings = {
	enabled: false,
	address: {
		streetAddress: '',
		addressLocality: '',
		addressRegion: '',
		postalCode: '',
		addressCountry: '',
	},
	telephone: '',
	geo: { latitude: '', longitude: '' },
	openingHours: {
		Mo: { opens: '', closes: '' },
		Tu: { opens: '', closes: '' },
		We: { opens: '', closes: '' },
		Th: { opens: '', closes: '' },
		Fr: { opens: '', closes: '' },
		Sa: { opens: '', closes: '' },
		Su: { opens: '', closes: '' },
	},
	priceRange: '',
};

export const EMPTY_LOCAL_BUSINESS_DEFAULTS: LocalBusinessDefaults = {
	address: {
		streetAddress: '',
		addressLocality: '',
		addressRegion: '',
		postalCode: '',
		addressCountry: '',
	},
};

export const makeSchemaSettings = (
	overrides: Partial< SchemaSettings > = {}
): SchemaSettings => ( {
	organization: { name: '', description: '', sameAs: [], email: '' },
	localBusiness: structuredClone( EMPTY_LOCAL_BUSINESS ),
	defaults: {
		organization: { name: 'Acme Co', description: 'We make things' },
		localBusiness: structuredClone( EMPTY_LOCAL_BUSINESS_DEFAULTS ),
	},
	...overrides,
} );
