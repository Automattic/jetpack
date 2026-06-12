/**
 * External dependencies
 */
import { AuthorsWidget, WidgetRoot } from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from 'react';
import type { ComponentProps } from 'react';

const DEFAULT_MAX = 7;

type AuthorsAttributes = NonNullable< ComponentProps< typeof WidgetRoot >[ 'attributes' ] > & {
	max?: string;
};

type AuthorsRenderProps = {
	attributes?: AuthorsAttributes;
};

const toPositiveInt = ( value: string | undefined, fallback: number ) => {
	const parsed = Number.parseInt( value ?? '', 10 );

	return Number.isFinite( parsed ) && parsed > 0 ? parsed : fallback;
};

const toDateString = ( date: Date ) => {
	const pad = ( part: number ) => String( part ).padStart( 2, '0' );

	return `${ date.getFullYear() }-${ pad( date.getMonth() + 1 ) }-${ pad( date.getDate() ) }`;
};

/**
 * Build a "very long" default report range (all time, through the end of
 * today) used when the host doesn't pass explicit report params. Explicit
 * from/to pass through `normalizeReportParams` untouched, so this wide range
 * survives WidgetRoot's normalization instead of the rolling default preset.
 *
 * TODO: Remove the default range once we have a way to pass the launched date to the widget.
 */
const getDefaultReportParams = () => ( {
	from: '2000-01-01T00:00:00',
	to: `${ toDateString( new Date() ) }T23:59:59`,
	interval: 'day' as const,
} );

/**
 * Authors widget render entry point.
 *
 * WidgetRoot provides the analytics query client, chart theme, and the
 * resolved report params consumed by the toolkit widget.
 *
 * @param props            - Render props.
 * @param props.attributes - Widget attributes.
 */
export default function Authors( { attributes }: AuthorsRenderProps ) {
	const attributesWithDefaults = useMemo( () => {
		const hasReportParams =
			!! attributes?.reportParams && Object.keys( attributes.reportParams ).length > 0;

		return hasReportParams ? attributes : { ...attributes, reportParams: getDefaultReportParams() };
	}, [ attributes ] );

	return (
		<WidgetRoot attributes={ attributesWithDefaults }>
			<AuthorsWidget max={ toPositiveInt( attributes?.max, DEFAULT_MAX ) } />
		</WidgetRoot>
	);
}
