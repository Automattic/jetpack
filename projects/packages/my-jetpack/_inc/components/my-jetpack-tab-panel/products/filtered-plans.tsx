/* eslint-disable @wordpress/no-unsafe-wp-apis */
import { __experimentalText as Text } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { ProductSection } from './product-section';
import { Skeleton } from './skeleton';
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
		return <Skeleton />;
	}

	let message = '';

	if ( errorPlans ) {
		message = __( 'Error getting plan information.', 'jetpack-my-jetpack' );
	} else if ( ! plans.length ) {
		message = __( 'No results found.', 'jetpack-my-jetpack' );
	}

	if ( message ) {
		return <Text size={ 20 }>{ message }</Text>;
	}

	return (
		<div>
			{ plans.map( section => {
				return <ProductSection key={ section.id } section={ section } />;
			} ) }
		</div>
	);
}
