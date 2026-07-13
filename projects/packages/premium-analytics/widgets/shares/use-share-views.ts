/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { useStatsSite } from '@jetpack-premium-analytics/data';

export interface ShareView {
	/**
	 * Service slug (e.g. `facebook`), taken from the `shares_<service>` key.
	 */
	service: string;
	/**
	 * Human-readable network name.
	 */
	label: string;
	/**
	 * Number of times content was shared to this network.
	 */
	value: number;
}

interface UseShareViewsArgs {
	/**
	 * Maximum rows to display; `0` means all.
	 */
	max: number;
}

interface ShareViewsState {
	data: ShareView[];
	isLoading: boolean;
	isFetching: boolean;
	isError: boolean;
	refetch: () => void;
}

const SHARES_PREFIX = 'shares_';

// Display names for the known sharing services. Unlisted services fall back to a
// humanized slug, so a new network still renders a sensible label.
const SERVICE_LABELS: Record< string, string > = {
	facebook: 'Facebook',
	twitter: 'Twitter',
	linkedin: 'LinkedIn',
	tumblr: 'Tumblr',
	pinterest: 'Pinterest',
	reddit: 'Reddit',
	pocket: 'Pocket',
	telegram: 'Telegram',
	whatsapp: 'WhatsApp',
	skype: 'Skype',
	google_plus: 'Google+',
	print: 'Print',
	email: 'Email',
	press_this: 'Press This',
	custom: __( 'Custom share buttons', 'jetpack-premium-analytics' ),
};

function canonicalService( service: string ): string {
	const normalized = service.replace( /-/g, '_' );

	if ( normalized.startsWith( 'custom_' ) ) {
		return 'custom';
	}

	if ( normalized.startsWith( 'google_plus' ) ) {
		return 'google_plus';
	}

	if ( normalized === 'jetpack_whatsapp' ) {
		return 'whatsapp';
	}

	return normalized;
}

function serviceLabel( service: string ): string {
	return (
		SERVICE_LABELS[ service ] ??
		service
			.split( '_' )
			.filter( Boolean )
			.map( part => part.charAt( 0 ).toUpperCase() + part.slice( 1 ) )
			.join( ' ' )
	);
}

export function buildShareViews( summary: Record< string, unknown >, max: number ): ShareView[] {
	const byService = new Map< string, ShareView >();

	Object.entries( summary ).forEach( ( [ key, value ] ) => {
		if ( ! key.startsWith( SHARES_PREFIX ) ) {
			return;
		}

		const count = Number( value ) || 0;
		if ( count <= 0 ) {
			return;
		}

		const service = canonicalService( key.slice( SHARES_PREFIX.length ) );
		const previous = byService.get( service );

		byService.set( service, {
			service,
			label: serviceLabel( service ),
			value: ( previous?.value ?? 0 ) + count,
		} );
	} );

	return [ ...byService.values() ]
		.sort( ( a, b ) => b.value - a.value )
		.slice( 0, max > 0 ? max : undefined );
}

/**
 * Fetch per-network share counts for the Shares widget via the shared Stats data layer.
 *
 * The counts live on the site summary (`stats` endpoint) as `shares_<service>`
 * fields, so this delegates to `useStatsSite`. The summary is all-time and has no
 * comparison period; rows are sorted by share count and trimmed to `max`.
 *
 * @param {UseShareViewsArgs} args - Hook arguments.
 * @return The current data/loading/error state.
 */
export default function useShareViews( { max }: UseShareViewsArgs ): ShareViewsState {
	const { data, isLoading, isFetching, isError, refetch } = useStatsSite();

	const summary = ( data as { stats?: Record< string, unknown > } | undefined )?.stats ?? {};

	const items = buildShareViews( summary, max );

	return {
		data: items,
		isLoading,
		isFetching,
		// The summary query carries `placeholderData: previousData => previousData`, so
		// keep showing prior rows on a transient refetch failure and only surface the
		// error when there's nothing to show.
		isError: items.length === 0 && isError,
		refetch,
	};
}
