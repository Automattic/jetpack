/**
 * The Studio editor's tools and their selection state.
 *
 * Tools swap the timeline area below the shared preview player; the rail
 * drives selection. 'chapters' is declared here ahead of its UI so the
 * `?tool=` deep link and rail plumbing are stable.
 */

export type StudioTool = 'trim-cut' | 'chapters';

const TOOLS: readonly StudioTool[] = [ 'trim-cut', 'chapters' ];

/**
 * The tool an editor visit should open with: the `?tool=` query argument
 * when it names a known tool (the Details tab deep-links
 * `?tool=chapters`), else the default trim & cut.
 *
 * Read once at mount — the editor owns the state afterwards.
 *
 * @return The initial tool.
 */
export function initialToolFromLocation(): StudioTool {
	const requested = new URLSearchParams( window.location.search ).get( 'tool' );
	return TOOLS.includes( requested as StudioTool ) ? ( requested as StudioTool ) : 'trim-cut';
}
