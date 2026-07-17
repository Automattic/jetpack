/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import type { Field } from '@wordpress/dataviews';

export type ClickRow = {
	id: string;
	clickedUrl: string;
	href: string;
	group: string;
	clicks: number;
};

/**
 * Return a URL only when it parses with an HTTP or HTTPS scheme.
 *
 * @param url - The candidate URL.
 * @return The safe HTTP(S) URL, or null when it is missing, unparseable, or uses another scheme.
 */
function safeHttpUrl( url: string | undefined ): string | null {
	if ( ! url ) {
		return null;
	}

	try {
		const { protocol } = new URL( url );
		return protocol === 'http:' || protocol === 'https:' ? url : null;
	} catch {
		return null;
	}
}

/**
 * DataViews field config for the Clicks records table.
 *
 * @return The field config.
 */
export function getClicksFields(): Field< ClickRow >[] {
	return [
		{
			id: 'clickedUrl',
			label: __( 'Clicked URL', 'jetpack-premium-analytics' ),
			enableGlobalSearch: true,
			enableHiding: false,
			getValue: ( { item } ) => item.clickedUrl,
			render: ( { item } ) => {
				const safeUrl = safeHttpUrl( item.href );

				return safeUrl ? (
					<a href={ safeUrl } target="_blank" rel="noopener noreferrer">
						{ item.clickedUrl }
					</a>
				) : (
					<>{ item.clickedUrl }</>
				);
			},
		},
		{
			id: 'group',
			label: __( 'Group', 'jetpack-premium-analytics' ),
			enableGlobalSearch: true,
			getValue: ( { item } ) => item.group,
		},
		{
			id: 'clicks',
			label: __( 'Clicks', 'jetpack-premium-analytics' ),
			getValue: ( { item } ) => item.clicks,
			render: ( { item } ) => <>{ item.clicks.toLocaleString() }</>,
		},
	];
}
