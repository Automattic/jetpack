import { useEntityRecords } from '@wordpress/core-data';
import { useMemo } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { getUrlPath } from '../lib/get-url-path';

const LATEST_RESPONSES_PER_PAGE = 10;

export type LatestResponseRow = {
	id: string;
	responseId: number;
	date: string;
	author_name?: string;
	author_email?: string;
	author_url?: string;
	ip?: string;
	entry_title?: string;
	entry_permalink?: string;
	is_test?: boolean;
	is_unread?: boolean;
	preview_url?: string | null;
	/** Precomputed label for sorting and getValue. */
	from: string;
	/** Precomputed label for sorting and getValue. */
	source: string;
};

type FeedbackRecord = {
	id: number;
	date?: string;
	author_name?: string;
	author_email?: string;
	author_url?: string;
	ip?: string;
	entry_title?: string;
	entry_permalink?: string;
	is_test?: boolean;
	is_unread?: boolean;
	preview_url?: string | null;
};

/**
 * Resolve the display label for the response author.
 *
 * @param record - Feedback record from the REST API.
 * @return Author label for the From column.
 */
function getFromLabel( record: FeedbackRecord ): string {
	const label = record.author_name || record.author_email || record.author_url || record.ip || '';
	return label ? decodeEntities( label ) : __( 'Anonymous', 'jetpack-forms' );
}

/**
 * Resolve the source label for a response (page title or form preview).
 *
 * @param record - Feedback record from the REST API.
 * @return Source label for the Source column.
 */
function getSourceLabel( record: FeedbackRecord ): string {
	if ( record.is_test ) {
		return __( 'Form preview', 'jetpack-forms' );
	}

	const title = record.entry_title ? decodeEntities( record.entry_title ) : '';
	const path = record.entry_permalink ? getUrlPath( record.entry_permalink ) : null;

	return title || path || __( '(no title)', 'jetpack-forms' );
}

/**
 * Map a feedback REST record to a DataViews row.
 *
 * @param record - Feedback record from the REST API.
 * @return Table row.
 */
function mapFeedbackToRow( record: FeedbackRecord ): LatestResponseRow {
	return {
		id: String( record.id ),
		responseId: record.id,
		date: typeof record.date === 'string' ? record.date : '',
		author_name: record.author_name,
		author_email: record.author_email,
		author_url: record.author_url,
		ip: record.ip,
		entry_title: record.entry_title,
		entry_permalink: record.entry_permalink,
		is_test: record.is_test,
		is_unread: record.is_unread,
		preview_url: record.preview_url,
		from: getFromLabel( record ),
		source: getSourceLabel( record ),
	};
}

/**
 * Load the 10 most recent inbox responses for the widget table.
 *
 * @return Entity records query result with mapped rows.
 */
export function useLatestResponses() {
	const query = useMemo(
		() => ( {
			per_page: LATEST_RESPONSES_PER_PAGE,
			page: 1,
			status: 'draft,publish',
			orderby: 'date',
			order: 'desc',
			fields_format: 'collection',
		} ),
		[]
	);

	const { records, hasResolved } = useEntityRecords( 'postType', 'feedback', query );

	const data = useMemo( () => {
		if ( ! records?.length ) {
			return [];
		}

		return ( records as FeedbackRecord[] ).map( mapFeedbackToRow );
	}, [ records ] );

	return {
		data,
		isLoading: ! hasResolved,
		isError: false,
		error: null,
	};
}
