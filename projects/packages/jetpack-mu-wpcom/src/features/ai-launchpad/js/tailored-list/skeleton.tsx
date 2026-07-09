const PLACEHOLDER_COUNT = 5;

/**
 * Loading placeholder for the tailored list's task column, shown while the AI
 * call is in flight.
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
