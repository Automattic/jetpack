/**
 * Mock for the WordPress components package used during icon extraction.
 * We bypass the Icon component's rendering and extract the inner
 * icon element from props, so this just needs to not crash on import.
 *
 * @return {null} Always returns null.
 */
export function Icon() {
	return null;
}
