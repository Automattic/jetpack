/**
 * Shared Jest replacement for the `@jetpack-premium-analytics/widgets-toolkit`
 * pieces the dashboard's feedback banner and onboarding read.
 *
 * Grouped suites share one instance, so each clears it in its own `beforeEach`.
 */
export const mockRecordEvent = jest.fn();

export const mockDashboardToolkit = {
	useTrackEvent: () => mockRecordEvent,
	// The real modal's two exits, which is all the banner reacts to.
	FeedbackModal: ( {
		source,
		onSubmit,
		onClose,
	}: {
		source: string;
		onSubmit?: () => void;
		onClose: () => void;
	} ) => (
		<div>
			<span>Feedback modal from { source }</span>
			{ /* Send and Done are two steps in the real modal: it thanks the
			     reader in between, so the banner sees the two calls apart. */ }
			<button type="button" onClick={ onSubmit }>
				Send feedback
			</button>
			<button type="button" onClick={ onClose }>
				Done
			</button>
			<button type="button" onClick={ onClose }>
				Cancel
			</button>
		</div>
	),
};
