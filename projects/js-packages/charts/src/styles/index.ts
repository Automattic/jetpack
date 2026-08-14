import styles from './chart-scope.module.scss';

/**
 * Class that declares the `--a8c-charts-*` catalog. Apply it to every element
 * that acts as a chart scope so descendants — and the JS bridge resolving
 * against that element — read the same token values.
 */
export const chartScopeClass: string = styles.scope;
