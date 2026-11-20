import type * as Facade from './index';
import type * as Api from '@automattic/jetpack-premium-analytics-sdk';

// Fails the typecheck when the facade misses a value the API contract declares.
type MissingFromFacade = Exclude< keyof typeof Api, keyof typeof Facade >;

export const isComplete: [ MissingFromFacade ] extends [ never ] ? true : MissingFromFacade = true;

// And when the facade exports a value the API contract does not declare: a consumer could not import it.
type MissingFromApi = Exclude< keyof typeof Facade, keyof typeof Api >;

export const isDeclared: [ MissingFromApi ] extends [ never ] ? true : MissingFromApi = true;

// And when the facade's `useReport` stops satisfying the signature the contract declares. Checked on
// one data shape: the generic forms do not relate through React Query's placeholder guard.
type Probe = { summary: Record< string, number > };

export const useReportConforms: typeof Api.useReport< Probe > =
	null as unknown as typeof Facade.useReport< Probe >;

// And when the contract declares a `useReport` option the facade does not take: the signature check
// above lets an extra optional key through, and the facade would ignore it at runtime.
type UntakenReportOption = Exclude<
	keyof Api.UseReportOptions,
	keyof NonNullable< Parameters< typeof Facade.useReport >[ 2 ] >
>;

export const reportOptionsTaken: [ UntakenReportOption ] extends [ never ]
	? true
	: UntakenReportOption = true;

// And when the facade's `Donut` stops accepting the props the contract declares.
export const donutConforms: typeof Api.Donut = null as unknown as typeof Facade.Donut;

// And when the facade's `Funnel` stops accepting the props the contract declares.
export const funnelConforms: typeof Api.Funnel = null as unknown as typeof Facade.Funnel;

// And when the facade's `Columns` stops accepting the props the contract declares.
export const columnsConforms: typeof Api.Columns = null as unknown as typeof Facade.Columns;

// And when the facade's `Locations` stops accepting the props the contract declares.
export const locationsConforms: typeof Api.Locations = null as unknown as typeof Facade.Locations;
