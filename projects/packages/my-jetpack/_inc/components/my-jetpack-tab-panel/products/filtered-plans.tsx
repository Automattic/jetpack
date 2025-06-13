import { ProductSection } from './product-section';
import { useFilteredPlans } from './use-filtered-plans';

export type FilteredPlansProps = {
	search: string;
};

/**
 * Renders the filtered plans.
 *
 * @param {FilteredPlansProps} props - The component props.
 *
 * @return The rendered component.
 */
export function FilteredPlans( { search }: FilteredPlansProps ) {
	const { plans, isLoadingPlans, errorPlans } = useFilteredPlans( { search } );

	if ( isLoadingPlans ) {
		return <div>Loading...</div>;
	}

	if ( errorPlans ) {
		return <div>Error loading plans.</div>;
	}

	return (
		<div>
			{ plans.map( section => {
				return <ProductSection key={ section.id } section={ section } />;
			} ) }
		</div>
	);
}
