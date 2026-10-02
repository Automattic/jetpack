import * as React from 'react';
/**
 * Provides a default Content Security Policy (CSP) configuration for Base UI components that
 * require inline `<style>` or `<script>` tags.
 *
 * Documentation: [Base UI CSP Provider](https://base-ui.com/react/utils/csp-provider)
 */
export declare function CSPProvider(props: CSPProvider.Props): React.JSX.Element;
export interface CSPProviderState {}
export interface CSPProviderProps {
  children?: React.ReactNode;
  /**
   * The nonce value to apply to inline `<style>` and `<script>` tags.
   */
  nonce?: string | undefined;
  /**
   * Whether inline `<style>` elements created by Base UI components should not be rendered. Instead, components must specify the CSS styles via custom class names or other methods.
   * @default false
   */
  disableStyleElements?: boolean | undefined;
}
export declare namespace CSPProvider {
  type State = CSPProviderState;
  type Props = CSPProviderProps;
}