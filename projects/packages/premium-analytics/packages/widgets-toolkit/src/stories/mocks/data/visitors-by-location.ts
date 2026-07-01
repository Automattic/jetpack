/**
 * Visitors by location mock data (sessions/by-location)
 *
 * Mirrors the API response shape used by `fetchReportVisitorsByLocation`.
 */
type CountryItem = {
	country_code: string;
	label: string;
	visitors: string;
};

type RegionItem = {
	country_code: 'US';
	label: string;
	region: string;
	visitors: string;
};

export type VisitorsByLocationResponse = {
	summary: {
		visitors: string;
		date_start: string;
		date_end: string;
	};
	data: Array< CountryItem | RegionItem >;
};

const US_STATE_PRIMARY = [
	{ label: 'California', region: 'California', visitors: 1000 },
	{ label: 'New York', region: 'New York', visitors: 500 },
	{ label: 'Texas', region: 'Texas', visitors: 450 },
	{ label: 'Florida', region: 'Florida', visitors: 400 },
	{ label: 'Illinois', region: 'Illinois', visitors: 350 },
	{ label: 'Ohio', region: 'Ohio', visitors: 300 },
	{ label: 'Pennsylvania', region: 'Pennsylvania', visitors: 250 },
	{ label: 'Michigan', region: 'Michigan', visitors: 200 },
	{ label: 'Wisconsin', region: 'Wisconsin', visitors: 150 },
	{ label: 'Minnesota', region: 'Minnesota', visitors: 120 },
	{ label: 'Indiana', region: 'Indiana', visitors: 100 },
	{ label: 'Iowa', region: 'Iowa', visitors: 80 },
	{ label: 'Missouri', region: 'Missouri', visitors: 60 },
	{ label: 'North Dakota', region: 'North Dakota', visitors: 40 },
	{ label: 'South Dakota', region: 'South Dakota', visitors: 20 },
	{ label: 'Nebraska', region: 'Nebraska', visitors: 10 },
] as const;

const US_STATE_COMPARISON = [
	{ label: 'California', region: 'California', visitors: 900 },
	{ label: 'New York', region: 'New York', visitors: 550 },
	{ label: 'Texas', region: 'Texas', visitors: 400 },
	{ label: 'Florida', region: 'Florida', visitors: 380 },
	{ label: 'Illinois', region: 'Illinois', visitors: 360 },
	{ label: 'Ohio', region: 'Ohio', visitors: 280 },
	{ label: 'Pennsylvania', region: 'Pennsylvania', visitors: 240 },
	{ label: 'Michigan', region: 'Michigan', visitors: 210 },
	{ label: 'Wisconsin', region: 'Wisconsin', visitors: 140 },
	{ label: 'Minnesota', region: 'Minnesota', visitors: 130 },
	{ label: 'Indiana', region: 'Indiana', visitors: 90 },
	{ label: 'Iowa', region: 'Iowa', visitors: 75 },
	{ label: 'Missouri', region: 'Missouri', visitors: 55 },
	{ label: 'North Dakota', region: 'North Dakota', visitors: 35 },
	{ label: 'South Dakota', region: 'South Dakota', visitors: 22 },
	{ label: 'Nebraska', region: 'Nebraska', visitors: 12 },
] as const;

const WORLD_COUNTRY_PRIMARY = [
	{ country_code: 'US', label: 'United States', visitors: 8500 },
	{ country_code: 'GB', label: 'United Kingdom', visitors: 4200 },
	{ country_code: 'DE', label: 'Germany', visitors: 3800 },
	{ country_code: 'JP', label: 'Japan', visitors: 3100 },
	{ country_code: 'FR', label: 'France', visitors: 2900 },
	{ country_code: 'BR', label: 'Brazil', visitors: 2400 },
	{ country_code: 'IN', label: 'India', visitors: 2200 },
	{ country_code: 'AU', label: 'Australia', visitors: 1800 },
	{ country_code: 'CA', label: 'Canada', visitors: 1650 },
	{ country_code: 'MX', label: 'Mexico', visitors: 1400 },
	{ country_code: 'ES', label: 'Spain', visitors: 1100 },
	{ country_code: 'IT', label: 'Italy', visitors: 950 },
	{ country_code: 'NL', label: 'Netherlands', visitors: 720 },
	{ country_code: 'SE', label: 'Sweden', visitors: 480 },
	{ country_code: 'PL', label: 'Poland', visitors: 390 },
] as const;

const WORLD_COUNTRY_COMPARISON = [
	{ country_code: 'US', label: 'United States', visitors: 7800 },
	{ country_code: 'GB', label: 'United Kingdom', visitors: 4500 },
	{ country_code: 'DE', label: 'Germany', visitors: 3500 },
	{ country_code: 'JP', label: 'Japan', visitors: 2800 },
	{ country_code: 'FR', label: 'France', visitors: 3100 },
	{ country_code: 'BR', label: 'Brazil', visitors: 2100 },
	{ country_code: 'IN', label: 'India', visitors: 1900 },
	{ country_code: 'AU', label: 'Australia', visitors: 1750 },
	{ country_code: 'CA', label: 'Canada', visitors: 1500 },
	{ country_code: 'MX', label: 'Mexico', visitors: 1550 },
	{ country_code: 'ES', label: 'Spain', visitors: 980 },
	{ country_code: 'IT', label: 'Italy', visitors: 1020 },
	{ country_code: 'NL', label: 'Netherlands', visitors: 680 },
	{ country_code: 'SE', label: 'Sweden', visitors: 510 },
	{ country_code: 'PL', label: 'Poland', visitors: 350 },
] as const;

function sumVisitors( items: ReadonlyArray< { visitors: number } > ) {
	return items.reduce( ( acc, i ) => acc + i.visitors, 0 );
}

export function buildVisitorsByLocationResponse( opts: {
	period: { from: string; to: string };
	groupBy: 'country' | 'region';
	isComparison: boolean;
} ): VisitorsByLocationResponse {
	const { period, groupBy, isComparison } = opts;

	if ( groupBy === 'region' ) {
		const source = isComparison ? US_STATE_COMPARISON : US_STATE_PRIMARY;
		return {
			summary: {
				visitors: String( sumVisitors( source ) ),
				date_start: period.from,
				date_end: period.to,
			},
			data: source.map( i => ( {
				country_code: 'US',
				label: i.label,
				region: i.region,
				visitors: String( i.visitors ),
			} ) ),
		};
	}

	const source = isComparison ? WORLD_COUNTRY_COMPARISON : WORLD_COUNTRY_PRIMARY;
	return {
		summary: {
			visitors: String( sumVisitors( source ) ),
			date_start: period.from,
			date_end: period.to,
		},
		data: source.map( i => ( {
			country_code: i.country_code,
			label: i.label,
			visitors: String( i.visitors ),
		} ) ),
	};
}
