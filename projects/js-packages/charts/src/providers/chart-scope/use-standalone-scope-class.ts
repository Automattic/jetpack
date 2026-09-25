import { useContext } from 'react';
import { CHART_SCOPE_CLASS } from '../../styles/chart-scope-class';
import { GlobalChartsContext } from '../chart-context/global-charts-provider';

/**
 * Returns the catalog class when there is no `GlobalChartsProvider` above this component, and `undefined` when there is.
 *
 * Standalone components need the catalog to resolve at all, but inside a provider the tokens already inherit — re-declaring them there would shadow a consumer override set anywhere in the tree.
 *
 * @return The scope class name, or undefined when a provider is present.
 */
export const useStandaloneScopeClass = (): string | undefined =>
	useContext( GlobalChartsContext ) ? undefined : CHART_SCOPE_CLASS;
