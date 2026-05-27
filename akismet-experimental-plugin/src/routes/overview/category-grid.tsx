/**
 * `<CategoryGrid>` — maps the six entries in CATEGORIES into one
 * <CategoryCard> apiece. The grid layout (3 / 2 / 1 columns at
 * decreasing widths) is handled in overview.scss.
 */
import { CategoryCard } from '@/routes/overview/category-card';
import { CATEGORIES, type CategoryId } from '@/routes/overview/category-config';
import type { StatsInterval } from '@/lib/types';

type Props = {
	interval: StatsInterval;
	onDrillDown: ( id: CategoryId ) => void;
};

/**
 * Render the six-card grid.
 *
 * @param props - The component props.
 * @return The rendered grid.
 */
export function CategoryGrid( props: Props ): JSX.Element {
	const { interval, onDrillDown } = props;
	return (
		<div className="akismet-category-grid">
			{ CATEGORIES.map( def => (
				<CategoryCard
					key={ def.id }
					id={ def.id }
					interval={ interval }
					onDrillDown={ onDrillDown }
				/>
			) ) }
		</div>
	);
}
