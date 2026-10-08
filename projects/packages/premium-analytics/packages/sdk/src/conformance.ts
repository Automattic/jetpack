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
