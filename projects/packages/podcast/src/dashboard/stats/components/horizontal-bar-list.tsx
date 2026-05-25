import {
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalHStack as HStack,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalText as Text,
} from '@wordpress/components';
import type { ReactNode, MouseEventHandler } from 'react';

// Not @automattic/charts BarListChart — that's SVG/visx with no per-row onClick (Top episodes needs drilldown).
// LeaderboardChart is HTML but its data model is currentValue/previousValue/currentShare, wrong shape here.

export type HorizontalBarRow = {
	id: string;
	label: ReactNode;
	/** Plain-text label for screen readers / tooltips when `label` is a node. */
	labelText?: string;
	value: number;
	maxValue: number;
	formattedValue: string;
	leftSideItem?: ReactNode;
	onClick?: MouseEventHandler< HTMLButtonElement >;
};

type HorizontalBarListProps = {
	rows: HorizontalBarRow[];
};

const HorizontalBarList = ( { rows }: HorizontalBarListProps ) => {
	return (
		<ul className="podcast-stats-bar-list">
			{ rows.map( row => {
				const pct = row.maxValue > 0 ? Math.max( 1, ( row.value / row.maxValue ) * 100 ) : 0;
				const accessibleLabel =
					row.labelText !== undefined ? `${ row.labelText }: ${ row.formattedValue }` : undefined;
				const inner = (
					<>
						<span
							className="podcast-stats-bar-list__bar"
							style={ { width: `${ pct }%` } }
							aria-hidden="true"
						/>
						<HStack
							as="span"
							className="podcast-stats-bar-list__content"
							spacing={ 2 }
							justify="flex-start"
							alignment="center"
						>
							{ row.leftSideItem && (
								<span className="podcast-stats-bar-list__leading">{ row.leftSideItem }</span>
							) }
							<Text className="podcast-stats-bar-list__label" truncate>
								{ row.label }
							</Text>
							<Text className="podcast-stats-bar-list__value" size={ 12 } variant="muted" truncate>
								{ row.formattedValue }
							</Text>
						</HStack>
					</>
				);
				return (
					<li key={ row.id } className="podcast-stats-bar-list__item">
						{ row.onClick ? (
							<button
								type="button"
								className="podcast-stats-bar-list__row is-clickable"
								onClick={ row.onClick }
								aria-label={ accessibleLabel }
							>
								{ inner }
							</button>
						) : (
							<div
								className="podcast-stats-bar-list__row"
								role={ accessibleLabel ? 'group' : undefined }
								aria-label={ accessibleLabel }
							>
								{ inner }
							</div>
						) }
					</li>
				);
			} ) }
		</ul>
	);
};

export default HorizontalBarList;
