import { Card, CardBody } from '@wordpress/components';

const PLACEHOLDER_COUNT = 6;

/**
 * Loading placeholder for the tailored list, shown while the AI call is in
 * flight. Renders six shimmering cards so the layout doesn't jump when the
 * real task cards arrive.
 *
 * @return The skeleton element.
 */
export function TailoredListSkeleton() {
	return (
		<div className="ai-launchpad-tailored-list">
			{ Array.from( { length: PLACEHOLDER_COUNT } ).map( ( _, index ) => (
				<Card key={ index } className="ai-launchpad-tailored-list__card is-skeleton">
					<CardBody>
						<span className="ai-launchpad-tailored-list__skeleton-line is-title" />
					</CardBody>
				</Card>
			) ) }
		</div>
	);
}
