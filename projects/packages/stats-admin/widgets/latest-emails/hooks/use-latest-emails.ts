import { getSiteData, isSimpleSite } from '@automattic/jetpack-script-data';
import { useQuery } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

const LATEST_EMAILS_QUERY_KEY = [ 'jetpack', 'latest-emails' ] as const;
const EMAIL_SUMMARY_QUANTITY = 10;

export type LatestEmailRow = {
	id: string;
	postId: number;
	title: string;
	openRate: number | null;
	clicks: number;
};

type EmailSummaryPost = {
	id?: number | string;
	post_id?: number;
	ID?: number;
	post_title?: string;
	title?: string;
	opens?: number | string;
	clicks?: number | string;
	opens_rate?: number | string;
	open_rate?: number;
	rate?: number;
};

/**
 * Parse a numeric field from the email summary API (values may be numbers or strings).
 *
 * @param value - Raw field value.
 * @return Parsed number or null when missing or invalid.
 */
function parseNumericField( value: number | string | undefined | null ): number | null {
	if ( value === undefined || value === null || value === '' ) {
		return null;
	}

	const parsed = typeof value === 'number' ? value : Number( value );
	return Number.isNaN( parsed ) ? null : parsed;
}

/**
 * Resolve the post ID from an email summary row.
 *
 * @param raw - API post payload.
 * @return Post ID or null when missing.
 */
function getEmailSummaryPostId( raw: EmailSummaryPost ): number | null {
	return parseNumericField( raw.id ?? raw.post_id ?? raw.ID );
}

/**
 * Resolve open rate (0–100) from an email summary row.
 *
 * @param raw - API post payload.
 * @return Open rate percentage or null when unknown.
 */
function getEmailSummaryOpenRate( raw: EmailSummaryPost ): number | null {
	let openRate = parseNumericField( raw.opens_rate ?? raw.open_rate ?? raw.rate );

	if ( openRate === null ) {
		return null;
	}

	if ( openRate >= 0 && openRate <= 1 ) {
		openRate = openRate * 100;
	}

	return openRate;
}

type EmailSummaryResponse = {
	posts?: EmailSummaryPost[];
	errors?: Record< string, string[] >;
};

/**
 * Build the REST path for the email summary endpoint.
 *
 * @param blogId - Connected site ID.
 * @return REST path for the email summary endpoint.
 */
function getEmailSummaryPath( blogId: number ): string {
	const base = isSimpleSite() ? '/rest/v1.1/sites' : '/jetpack/v4/stats-app/sites';
	return addQueryArgs( `${ base }/${ blogId }/stats/emails/summary`, {
		quantity: EMAIL_SUMMARY_QUANTITY,
		sort_field: 'post_date',
		sort_order: 'desc',
	} );
}

/**
 * Map a single email summary post from the API.
 *
 * @param raw - API post payload.
 * @return Normalized row or null when post ID is missing.
 */
function mapEmailSummaryPost( raw: EmailSummaryPost ): LatestEmailRow | null {
	const postId = getEmailSummaryPostId( raw );
	if ( postId === null ) {
		return null;
	}

	const title = raw.post_title ?? raw.title ?? '';

	return {
		id: String( postId ),
		postId,
		title: title || String( postId ),
		openRate: getEmailSummaryOpenRate( raw ),
		clicks: parseNumericField( raw.clicks ) ?? 0,
	};
}

/**
 * Map the email summary API response to table rows.
 *
 * @param response - Email summary API response.
 * @return Mapped rows.
 */
function mapEmailSummaryResponse( response: EmailSummaryResponse ): LatestEmailRow[] {
	const wpError = response?.errors && Object.values( response.errors )?.[ 0 ]?.[ 0 ];
	if ( wpError ) {
		throw new Error( wpError );
	}

	if ( ! response?.posts || ! Array.isArray( response.posts ) ) {
		return [];
	}

	return response.posts
		.map( mapEmailSummaryPost )
		.filter( ( row ): row is LatestEmailRow => row !== null );
}

/**
 * Load the latest sent emails with opens and clicks summary.
 *
 * @return React Query result with email rows for DataViews.
 */
export function useLatestEmails() {
	return useQuery( {
		queryKey: LATEST_EMAILS_QUERY_KEY,
		queryFn: async () => {
			const blogId = getSiteData()?.wpcom?.blog_id;
			if ( ! blogId ) {
				throw new Error( 'Site ID is not available.' );
			}

			const response = await apiFetch< EmailSummaryResponse >( {
				path: getEmailSummaryPath( blogId ),
			} );

			if ( ! response || typeof response !== 'object' ) {
				throw new Error( 'Unexpected API response' );
			}

			return mapEmailSummaryResponse( response );
		},
		staleTime: 5 * 60 * 1000,
		retry: 1,
	} );
}
