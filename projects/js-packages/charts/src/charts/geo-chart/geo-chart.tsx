/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { FC, useContext, useEffect, useMemo, useRef } from 'react';
import { Chart, type GoogleChartPackages, type ReactGoogleChartEvent } from 'react-google-charts';
/**
 * Internal dependencies
 */
import { GlobalChartsContext, GlobalChartsProvider, useGlobalChartsContext } from '../../providers';
import { lightenHexColor, normalizeColorToHex } from '../../utils/color-utils';
import { resolveCssVariable } from '../../utils/resolve-css-var';
import { sanitizeHtml } from '../../utils/sanitize-html';
import { Center } from '../private/center';
import { withResponsive } from '../private/with-responsive';
import styles from './geo-chart.module.scss';
import type { GeoChartError, GeoChartProps } from './types';

const DEFAULT_FEATURE_FILL_COLOR = '#ffffff';
const DEFAULT_BACKGROUND_COLOR = '#ffffff';
// `chartPackages` replaces (not extends) react-google-charts' default `[ 'corechart', 'controls' ]`,
// so we restate the defaults and add `geochart`. Without it the loader backfills the geochart package
// late, which can clash with another Google Charts version already loaded on the page.
const GEO_CHART_PACKAGES: GoogleChartPackages[] = [ 'corechart', 'controls', 'geochart' ];

type GoogleChartOptions = Record< string, unknown >;
type GoogleChartErrorPayload = {
	id?: unknown;
	message?: unknown;
	detailedMessage?: unknown;
	options?: unknown;
};

// Google Charts renders draw errors as DOM elements injected into the chart
// container: a wrapper `<div id="google-visualization-errors-all-N">` holding
// one `<span id="google-visualization-errors-N">` per error. The span id is the
// error id accepted by `google.visualization.errors.removeError()`.
const GOOGLE_CHARTS_ERROR_ID_PREFIX = 'google-visualization-errors-';
const GOOGLE_CHARTS_ERROR_WRAPPER_INFIX = '-all-';

/**
 * Collects Google Charts error elements rendered inside a chart container.
 *
 * @param container - The chart container element to scan.
 * @return Errors found in the container, one per error span.
 */
function collectRenderedGeoChartErrors(
	container: HTMLElement
): Required< Pick< GeoChartError, 'id' | 'message' > >[] {
	const elements = container.querySelectorAll< HTMLElement >(
		`[id^="${ GOOGLE_CHARTS_ERROR_ID_PREFIX }"]`
	);

	return Array.from( elements )
		.filter( element => ! element.id.includes( GOOGLE_CHARTS_ERROR_WRAPPER_INFIX ) )
		.map( element => ( {
			id: element.id,
			message: element.textContent?.trim() ?? '',
		} ) )
		.filter( error => error.message.length > 0 );
}

/**
 * Whether a node added to the chart container is — or contains — a Google
 * Charts error element. Also matches text appended into an existing error
 * span, in case Google fills the message after inserting the element.
 *
 * @param node - The added DOM node to inspect.
 * @return Whether the node involves a Google Charts error element.
 */
function involvesGeoChartErrorElement( node: Node ): boolean {
	if ( node.nodeType === Node.TEXT_NODE ) {
		return !! node.parentElement?.id.startsWith( GOOGLE_CHARTS_ERROR_ID_PREFIX );
	}

	if ( ! ( node instanceof HTMLElement ) ) {
		return false;
	}

	return (
		node.id.startsWith( GOOGLE_CHARTS_ERROR_ID_PREFIX ) ||
		node.querySelector( `[id^="${ GOOGLE_CHARTS_ERROR_ID_PREFIX }"]` ) !== null
	);
}

/**
 * Normalizes the raw Google Charts error event into the GeoChart error shape.
 *
 * @param eventArgs - Error event payload from react-google-charts.
 * @return Normalized GeoChart error.
 */
function normalizeGeoChartError( eventArgs: unknown ): GeoChartError {
	const payload = Array.isArray( eventArgs ) ? eventArgs[ 0 ] : eventArgs;

	if ( ! payload || typeof payload !== 'object' ) {
		return {};
	}

	const { id, message, detailedMessage, options } = payload as GoogleChartErrorPayload;

	return {
		...( typeof id === 'string' && { id } ),
		...( typeof message === 'string' && { message } ),
		...( typeof detailedMessage === 'string' && { detailedMessage } ),
		...( options &&
			typeof options === 'object' &&
			! Array.isArray( options ) && { options: options as Record< string, unknown > } ),
	};
}

/**
 * Renders a geographical chart using Google Charts GeoChart to visualize data.
 *
 * Supports the full Google Charts data format including custom tooltips, formatted values,
 * and multiple data columns for maximum flexibility.
 *
 * Locations can be identified by full name (e.g., 'United States', 'California') or codes
 * (e.g., 'US', 'US-CA'). Full names are recommended for better readability in tooltips.
 *
 * @param props                   - The props for the GeoChart component
 * @param props.data              - Data in Google Charts format (array of arrays with headers)
 * @param props.width             - Width of the chart in pixels
 * @param props.height            - Height of the chart in pixels
 * @param props.region            - Region to display ('world', 'US', or ISO 3166-1 alpha-2 code)
 * @param props.resolution        - Resolution level ('countries', 'provinces', or 'metros')
 * @param props.onError           - Optional callback for Google Charts errors
 * @param props.className         - Additional CSS class name for the chart container
 * @param props.renderPlaceholder - Optional render function for the loading placeholder
 * @return A React component displaying an interactive map with data visualization
 */
const GeoChartInternal: FC< GeoChartProps > = ( {
	className,
	data,
	width,
	height,
	region = 'world',
	resolution = 'countries',
	onError,
	renderPlaceholder,
} ) => {
	const {
		getElementStyles,
		theme: {
			geoChart: { featureFillColor },
			backgroundColor,
		},
	} = useGlobalChartsContext();
	const containerRef = useRef< HTMLDivElement >( null );
	const reportedErrorIdsRef = useRef< Set< string > >( new Set() );

	// The ChartWrapper `error` event does not fire for every draw failure —
	// notably not when GeoChart's asynchronous map-file load fails (e.g.
	// `resolution: 'provinces'` for a country without a provinces map). Those
	// errors only surface as DOM elements Google injects into the container, so
	// watch the container and report them through the same `onError` callback.
	useEffect( () => {
		const container = containerRef.current;

		if ( ! onError || ! container || typeof MutationObserver === 'undefined' ) {
			return undefined;
		}

		const reportRenderedErrors = () => {
			for ( const error of collectRenderedGeoChartErrors( container ) ) {
				if ( reportedErrorIdsRef.current.has( error.id ) ) {
					continue;
				}

				reportedErrorIdsRef.current.add( error.id );
				onError( error );
			}
		};

		// GeoChart mutates the container heavily while drawing and resizing;
		// only rescan when an added node involves a Google error element.
		const observer = new MutationObserver( records => {
			const hasErrorNodes = records.some( record =>
				Array.from( record.addedNodes ).some( involvesGeoChartErrorElement )
			);

			if ( hasErrorNodes ) {
				reportRenderedErrors();
			}
		} );
		observer.observe( container, { childList: true, subtree: true } );
		// Report errors already rendered before the observer attached.
		reportRenderedErrors();

		return () => observer.disconnect();
	}, [ onError ] );

	// Render loading placeholder
	const loadingPlaceholder = (
		<Center
			className={ clsx( 'geo-chart', styles.container, className ) }
			data-testid="geo-chart-loading"
			style={ { width, height } }
		>
			{ renderPlaceholder ? renderPlaceholder() : __( 'Loading map', 'jetpack-charts' ) }
		</Center>
	);

	// Google charts doesn't accept CSS variables, so we need to convert them to hex colors
	const fullColorHex = getElementStyles( { index: 0 } ).color;
	const lightColorHex = lightenHexColor( fullColorHex, 0.8 );
	// Use normalizeColorToHex to ensure HSL/RGB values from CSS variables are converted to hex
	const backgroundColorHex =
		normalizeColorToHex( backgroundColor, null, resolveCssVariable ) || DEFAULT_BACKGROUND_COLOR;
	const defaultFillColorHex =
		normalizeColorToHex( featureFillColor, null, resolveCssVariable ) || DEFAULT_FEATURE_FILL_COLOR;

	// Identify HTML tooltip column indices and sanitize their content to prevent XSS.
	const sanitizedData = useMemo( () => {
		if ( data.length === 0 ) {
			return { data, hasHtmlTooltips: false };
		}

		const htmlTooltipIndices: number[] = [];
		for ( let i = 0; i < data[ 0 ].length; i++ ) {
			const col = data[ 0 ][ i ];
			if (
				typeof col === 'object' &&
				col !== null &&
				'role' in col &&
				col.role === 'tooltip' &&
				'p' in col &&
				typeof col.p === 'object' &&
				col.p !== null &&
				'html' in col.p &&
				col.p.html === true
			) {
				htmlTooltipIndices.push( i );
			}
		}

		if ( htmlTooltipIndices.length === 0 ) {
			return { data, hasHtmlTooltips: false };
		}

		// Sanitize HTML content in tooltip columns for data rows (skip header row)
		const sanitizedRows = data.slice( 1 ).map( row => {
			const newRow = [ ...row ];
			for ( const colIndex of htmlTooltipIndices ) {
				if ( typeof newRow[ colIndex ] === 'string' ) {
					newRow[ colIndex ] = sanitizeHtml( newRow[ colIndex ] as string );
				}
			}
			return newRow;
		} );

		return {
			data: [ data[ 0 ], ...sanitizedRows ] as typeof data,
			hasHtmlTooltips: true,
		};
	}, [ data ] );

	const options: GoogleChartOptions = useMemo(
		() => ( {
			...( region !== 'world' && { region } ),
			...( resolution !== 'countries' && { resolution } ),
			colorAxis: { colors: [ lightColorHex, fullColorHex ] },
			backgroundColor: backgroundColorHex,
			datalessRegionColor: defaultFillColorHex,
			defaultColor: defaultFillColorHex,
			tooltip: { trigger: 'focus', isHtml: sanitizedData.hasHtmlTooltips },
			legend: 'none',
			keepAspectRatio: true,
		} ),
		[
			region,
			resolution,
			lightColorHex,
			fullColorHex,
			backgroundColorHex,
			defaultFillColorHex,
			sanitizedData.hasHtmlTooltips,
		]
	);

	const chartEvents = useMemo< ReactGoogleChartEvent[] | undefined >( () => {
		if ( ! onError ) {
			return undefined;
		}

		return [
			{
				eventName: 'error',
				callback: ( { eventArgs } ) => {
					onError( normalizeGeoChartError( eventArgs ) );
				},
			},
		];
	}, [ onError ] );

	return (
		<Center
			ref={ containerRef }
			className={ clsx( 'geo-chart', styles.container, className ) }
			data-testid="geo-chart"
			style={ { width, height, backgroundColor } }
		>
			<Chart
				chartType="GeoChart"
				chartPackages={ GEO_CHART_PACKAGES }
				width={ width }
				height={ height }
				data={ sanitizedData.data }
				options={ options }
				chartEvents={ chartEvents }
				loader={ loadingPlaceholder }
			/>
		</Center>
	);
};

const GeoChartWithProvider: FC< GeoChartProps > = props => {
	const existingContext = useContext( GlobalChartsContext );

	// If we're already in a GlobalChartsProvider context, don't create a new one
	if ( existingContext ) {
		return <GeoChartInternal { ...props } />;
	}

	// Otherwise, create our own GlobalChartsProvider
	return (
		<GlobalChartsProvider>
			<GeoChartInternal { ...props } />
		</GlobalChartsProvider>
	);
};

GeoChartWithProvider.displayName = 'GeoChart';

const GeoChartResponsive = withResponsive< GeoChartProps >( GeoChartWithProvider );

export { GeoChartResponsive as default, GeoChartWithProvider as GeoChartUnresponsive };
