import type * as Facade from './index';
import type * as Api from '@automattic/jetpack-premium-analytics-sdk';

// Fails the typecheck when the facade misses a value the API contract declares.
type MissingFromFacade = Exclude< keyof typeof Api, keyof typeof Facade >;

export const isComplete: [ MissingFromFacade ] extends [ never ] ? true : MissingFromFacade = true;
