import { __ } from '@wordpress/i18n';
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
		return <div>{ __( 'Loading…', 'jetpack-my-jetpack' ) }</div>;
	}

	if ( errorPlans ) {
		return <div>{ __( 'Error loading plans.', 'jetpack-my-jetpack' ) }</div>;
	}

	return (
		<div>
			{ plans.map( section => {
				return <ProductSection key={ section.id } section={ section } />;
			} ) }
		</div>
	);
}
