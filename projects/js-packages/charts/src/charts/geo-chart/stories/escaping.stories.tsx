import { expect, waitFor } from 'storybook/test';
import { GoogleDataTableColumnRoleType } from '../../../types';
import GeoChart from '../geo-chart';
import { geoChartMetaArgs, geoChartStoryArgs } from './config';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta< typeof GeoChart > = {
	...geoChartMetaArgs,
	title: 'JS Packages/Charts Library/Charts/Geo Chart/Tooltip Escaping',
	component: geoChartMetaArgs.component,
	tags: [ '!dev', '!autodocs' ],
};

export default meta;
type Story = StoryObj< typeof GeoChart >;

const PAYLOAD = '<img src="x">';
const MAP_LOAD_TIMEOUT = 10000;

const findShadedRegion = ( canvasElement: HTMLElement ) => {
	// Region fills are hex; outlines and patterns use `none` or `url(…)`. Unshaded regions vastly outnumber the one shaded region.
	const regions = [
		...canvasElement.querySelectorAll< SVGPathElement >( '.geo-chart svg path[fill^="#"]' ),
	];
	const fillCounts = new Map< string, number >();
	for ( const path of regions ) {
		const fill = path.getAttribute( 'fill' );
		fillCounts.set( fill, ( fillCounts.get( fill ) ?? 0 ) + 1 );
	}
	const [ datalessFill ] = [ ...fillCounts ].sort( ( a, b ) => b[ 1 ] - a[ 1 ] )[ 0 ] ?? [];
	return regions.find( path => path.getAttribute( 'fill' ) !== datalessFill );
};

const hover = ( region: SVGPathElement ) => {
	const { left, top, width, height } = region.getBoundingClientRect();
	const position = { bubbles: true, clientX: left + width / 2, clientY: top + height / 2 };
	region.dispatchEvent( new MouseEvent( 'mouseover', position ) );
	region.dispatchEvent( new MouseEvent( 'mousemove', position ) );
};

/**
 * Hovers the one shaded region and checks that every payload in its tooltip is text, not markup.
 *
 * @param params               - Story context.
 * @param params.canvasElement - The story root.
 * @param params.payloadCount  - How many times the payload appears in the tooltip.
 */
const expectTooltipEscapes = async ( {
	canvasElement,
	payloadCount,
}: {
	canvasElement: HTMLElement;
	payloadCount: number;
} ) => {
	// Retries cover both waits: Google loading the map from its CDN, and the paths it draws before it listens on them.
	await waitFor(
		() => {
			const tooltip = canvasElement.querySelector( '.google-visualization-tooltip' );
			if ( ! tooltip ) {
				const region = findShadedRegion( canvasElement );
				expect( region, 'Google Charts did not draw the map' ).toBeDefined();
				hover( region );
			}
			expect( tooltip ).not.toBeNull();
			expect(
				tooltip.querySelector( 'img' ),
				'The tooltip rendered the payload as markup'
			).toBeNull();
			expect( tooltip.textContent.split( PAYLOAD ) ).toHaveLength( payloadCount + 1 );
		},
		{ timeout: MAP_LOAD_TIMEOUT }
	);
};

export const TooltipColumnAndRegionName: Story = {
	args: {
		...geoChartStoryArgs,
		data: [
			[ 'Country', 'Orders', { type: 'string', role: GoogleDataTableColumnRoleType.tooltip } ],
			[ { v: 'US', f: PAYLOAD }, 1000, PAYLOAD ],
		],
	},
	play: ( { canvasElement } ) => expectTooltipEscapes( { canvasElement, payloadCount: 2 } ),
};

export const FormattedValue: Story = {
	args: {
		...geoChartStoryArgs,
		data: [
			[ 'Country', 'Orders' ],
			[ 'US', { v: 1000, f: PAYLOAD } ],
		],
	},
	play: ( { canvasElement } ) => expectTooltipEscapes( { canvasElement, payloadCount: 1 } ),
};
