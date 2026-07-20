type JetpackAdminNoticesProps = {
	/** Optional extra class appended to the container. */
	className?: string;
};

/**
 * Renders the `#jp-admin-notices` mount point that the shared jetpack-jitm
 * script injects the JITM `.jitm-card` into.
 *
 * This is ONLY the JITM slot — it does not render or manage other admin
 * notices. Render at most one per page (the jitm JS targets the first
 * element by id).
 *
 * @param {JetpackAdminNoticesProps} props           - Component props.
 * @param {string}                   props.className - Optional extra class appended to the container.
 * @return {JSX.Element} The mount point element.
 */
export default function JetpackAdminNotices( { className = '' }: JetpackAdminNoticesProps ) {
	return (
		<div
			id="jp-admin-notices"
			className={ `jetpack-jitm-card ${ className }`.trim() }
			aria-live="polite"
		/>
	);
}
