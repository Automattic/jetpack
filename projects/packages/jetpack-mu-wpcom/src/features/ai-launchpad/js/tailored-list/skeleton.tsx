import { Skeleton, Stack } from '@wordpress/ui';

const PLACEHOLDER_COUNT = 5;

/**
 * Loading placeholder for the tailored list's task column, shown while the AI
 * call is in flight.
 *
 * @return The skeleton element.
 */
export function TailoredListSkeleton() {
	return (
		<Stack direction="column" gap="sm" className="ai-launchpad-tailored-list">
			{ Array.from( { length: PLACEHOLDER_COUNT } ).map( ( _, index ) => (
				<Skeleton key={ index } className="ai-launchpad-tailored-list__skeleton-bar" />
			) ) }
		</Stack>
	);
}
