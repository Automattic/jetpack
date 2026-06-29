import { Card, Text } from '@wordpress/ui';
import type { CSSProperties, ReactElement, ReactNode } from 'react';

const NUMBER_FORMATTER = new Intl.NumberFormat();
const SKELETON_ROW_COUNT = 5;

/**
 * Computes the inline `--vp-row-bar` value for a row, expressed as the
 * row's value relative to the largest in the list (top row = 100%).
 *
 * @param value - This row's metric.
 * @param max   - Largest metric across all rows in the same card.
 * @return Inline style object setting the CSS custom property.
 */
function barStyle( value: number, max: number ): CSSProperties {
	const pct = max > 0 ? Math.max( 0, Math.min( 100, ( value / max ) * 100 ) ) : 0;
	return { '--vp-row-bar': `${ pct }%` } as CSSProperties;
}

export type RankingItem = {
	key: string;
	label: ReactNode;
	value: number;
};

type Props = {
	title: string;
	ariaLabel: string;
	columnHeader: string;
	valueColumnHeader: string;
	items: RankingItem[];
	isLoading: boolean;
	emptyMessage: string;
	footer?: ReactNode;
	formatValue?: ( value: number ) => string;
};

const defaultFormatValue = ( value: number ): string => NUMBER_FORMATTER.format( value );

/**
 * Two-column ranking list inside a card: a left label and a right
 * metric, with each row's background drawn as a percentage bar
 * proportional to the top row (top = 100%). Used by both "Most viewed"
 * (views per video) and "Top videos by watch time" (watch-time per
 * video) on the Overview screen.
 *
 * @param props                   - Component props.
 * @param props.title             - Card title.
 * @param props.ariaLabel         - Accessible name applied to the table wrapper.
 * @param props.columnHeader      - Left column header.
 * @param props.valueColumnHeader - Right column header — describes the metric the values represent (e.g. "VIEWS", "WATCH TIME").
 * @param props.items             - Rows to render; the largest value sets the 100% bar.
 * @param props.isLoading         - When true, renders 5 skeleton rows in place of items.
 * @param props.emptyMessage      - Message shown in place of the list when there are no items and the card is not loading.
 * @param props.footer            - Optional footer rendered below the list.
 * @param props.formatValue       - Optional per-row value formatter. Defaults to a locale-aware integer formatter.
 * @return The card element.
 */
export default function RankingCard( {
	title,
	ariaLabel,
	columnHeader,
	valueColumnHeader,
	items,
	isLoading,
	emptyMessage,
	footer,
	formatValue = defaultFormatValue,
}: Props ): ReactElement {
	const maxValue = Math.max( 0, ...items.map( item => item.value ) );
	const isEmpty = ! isLoading && items.length === 0;

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>{ title }</Card.Title>
			</Card.Header>
			<Card.Content>
				{ isEmpty ? (
					<Text className="vp-overview__ranking-empty">{ emptyMessage }</Text>
				) : (
					<div className="vp-overview__ranking" role="table" aria-label={ ariaLabel }>
						<div className="vp-overview__ranking-head" role="row">
							<span role="columnheader">{ columnHeader }</span>
							<span role="columnheader" className="vp-overview__ranking-values">
								{ valueColumnHeader }
							</span>
						</div>
						{ isLoading
							? Array.from( { length: SKELETON_ROW_COUNT } ).map( ( _, i ) => (
									<div
										key={ `skeleton-${ i }` }
										className="vp-overview__ranking-row vp-overview__ranking-row--skeleton"
										role="row"
										style={ { '--vp-row-bar': `${ 100 - i * 15 }%` } as CSSProperties }
									>
										<span role="cell">
											<span className="vp-overview__skeleton-block" />
										</span>
										<span role="cell" className="vp-overview__ranking-values">
											<span className="vp-overview__skeleton-block vp-overview__skeleton-block--narrow" />
										</span>
									</div>
							  ) )
							: items.map( item => (
									<div
										key={ item.key }
										className="vp-overview__ranking-row"
										role="row"
										style={ barStyle( item.value, maxValue ) }
									>
										<span role="cell">{ item.label }</span>
										<span role="cell" className="vp-overview__ranking-values">
											{ formatValue( item.value ) }
										</span>
									</div>
							  ) ) }
					</div>
				) }
				{ footer }
			</Card.Content>
		</Card.Root>
	);
}
