/**
 * GlobalChartsProvider namespace
 *
 * @example
 * ```tsx
 * import { GlobalChartsProvider } from '@automattic/charts';
 *
 * <GlobalChartsProvider theme={customTheme}>
 *   <BarChart data={data} />
 * </GlobalChartsProvider>
 * ```
 */
import {
	GlobalChartsProvider as GlobalChartsProviderComponent,
	useGlobalChartsContext,
	useGlobalChartsTheme,
	GlobalChartsContext,
	defaultTheme,
} from '../providers';

type GlobalChartsProviderNamespace = typeof GlobalChartsProviderComponent & {
	readonly useContext: typeof useGlobalChartsContext;
	readonly useTheme: typeof useGlobalChartsTheme;
	readonly Context: typeof GlobalChartsContext;
	readonly defaultTheme: typeof defaultTheme;
};

export const GlobalChartsProvider: GlobalChartsProviderNamespace = Object.assign(
	GlobalChartsProviderComponent,
	{
		useContext: useGlobalChartsContext,
		useTheme: useGlobalChartsTheme,
		Context: GlobalChartsContext,
		defaultTheme,
	}
);
