/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import useConfigValue from '../../../hooks/use-config-value.ts';
import { TOP_TAB_HREFS, type TopTab } from '../../constants.ts';
import type { Page } from '@wordpress/admin-ui';
import type { ComponentProps } from 'react';

type NavigationConfig = ComponentProps< typeof Page >[ 'navigation' ];

type Options = {
	activeTab: TopTab;
	isSingleFormView?: boolean;
};

/**
 * The Forms / Responses section navigation for the page header.
 *
 * Returns `undefined` where there is nothing to navigate between: Central Form
 * Management off leaves only Responses, and a single form's responses are a
 * child of the Forms section rather than a sibling of it.
 *
 * @param options                  - Options.
 * @param options.activeTab        - The section this screen belongs to.
 * @param options.isSingleFormView - Whether this screen shows one form's responses.
 * @return The `navigation` config for `FormsPage`, or `undefined`.
 */
export default function useTopNavigation( {
	activeTab,
	isSingleFormView = false,
}: Options ): NavigationConfig {
	const isCFMEnabled = useConfigValue( 'isCentralFormManagementEnabled' );

	return useMemo( () => {
		if ( ! isCFMEnabled || isSingleFormView ) {
			return undefined;
		}

		return {
			items: [
				{ label: __( 'Forms', 'jetpack-forms' ), href: TOP_TAB_HREFS.forms },
				{ label: __( 'Responses', 'jetpack-forms' ), href: TOP_TAB_HREFS.responses },
			],
			currentHref: TOP_TAB_HREFS[ activeTab ],
			ariaLabel: __( 'Dashboard sections', 'jetpack-forms' ),
		};
	}, [ isCFMEnabled, isSingleFormView, activeTab ] );
}
