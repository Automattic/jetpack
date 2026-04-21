export const JetpackSeoRoutes = {
	Overview: '/',
	Content: '/content',
	Settings: '/settings',
} as const;

// Named anchors inside the Settings screen. Used as URL hash fragments
// (e.g. `/settings#discoverability`) so Overview cards can deep-link the
// user straight into the card they care about.
export const JetpackSeoSections = {
	Visibility: 'visibility',
	Discoverability: 'discoverability',
	Verification: 'verification',
} as const;

export type JetpackSeoSection = ( typeof JetpackSeoSections )[ keyof typeof JetpackSeoSections ];

export const REST_NAMESPACE = 'jetpack-seo/v1';
