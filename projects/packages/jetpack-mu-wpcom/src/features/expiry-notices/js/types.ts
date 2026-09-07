export interface Cta {
	label: string;
	url: string;
	// Present only on the reverted state's CTA, which opens the Help Center with
	// this typed in rather than following its href.
	message?: string;
}
