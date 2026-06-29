const PLACEHOLDER_COUNT = 5;

/**
 * Loading placeholder for the tailored list's task column, shown while the AI
 * call is in flight. Rendered inside {@link Layout} so the heading and site
 * preview stay put; only these shimmering bars stand in for the task cards
 * until the real ones arrive.
 *
 * @return The skeleton element.
 */
export function TailoredListSkeleton() {
	return (
		<div className="ai-launchpad-tailored-list">
			{ Array.from( { length: PLACEHOLDER_COUNT } ).map( ( _, index ) => (
				<span
					key={ index }
					className="ai-launchpad-tailored-list__skeleton-bar"
					aria-hidden="true"
				/>
			) ) }
		</div>
	);
}
