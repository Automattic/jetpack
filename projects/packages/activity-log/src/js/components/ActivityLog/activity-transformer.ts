import parseActivityLogEntryContent from './formatted-block/parser';
import type {
	Activity,
	ActivityLogEntry,
	ActivityLogEntryImage,
	ActivityMediaDetails,
} from './types';

const parseTimestamp = ( published?: string ): number => {
	if ( ! published ) {
		return 0;
	}
	const timestamp = Date.parse( published );
	return Number.isNaN( timestamp ) ? 0 : timestamp;
};

const normalizeActivityMedia = ( image?: ActivityLogEntryImage | null ): ActivityMediaDetails => {
	if ( ! image ) {
		return {
			available: false,
			medium_url: '',
			name: '',
			thumbnail_url: '',
			type: '',
			url: '',
		};
	}

	return {
		available: Boolean( image.available ),
		medium_url: image.medium_url ?? '',
		name: image.name ?? '',
		thumbnail_url: image.thumbnail_url ?? '',
		type: image.type ?? '',
		url: image.url ?? '',
	};
};

/**
 * Transform an ActivityLogEntry (raw WPCOM shape) into an Activity (UI shape).
 *
 * @param entry - Raw entry from the /jetpack/v4/activity-log endpoint.
 * @return Normalized Activity for the DataViews table.
 */
export const transformActivityLogEntry = ( entry: ActivityLogEntry ): Activity => {
	const {
		content,
		actor,
		image,
		gridicon,
		activity_id: rawActivityId,
		name,
		object,
		status,
		summary,
		published,
		is_rewindable,
		rewind_id,
	} = entry;
	const descriptionItems = parseActivityLogEntryContent( content );
	const textDescription = content?.text ?? '';

	return {
		activityDescription: {
			textDescription,
			items: descriptionItems,
		},
		activityIcon: gridicon,
		activityId: rawActivityId,
		activityMedia: normalizeActivityMedia( image ),
		activityName: name,
		activityObject: object,
		activityStatus: status ?? '',
		activityTitle: summary,
		activityUnparsedTs: published ?? '',
		activityTs: parseTimestamp( published ),
		activityActor: {
			actorId: actor?.id,
			actorAvatarUrl: actor?.icon?.url,
			actorName: actor?.name,
			actorRole: actor?.role,
			actorType: actor?.type,
			isCli: actor?.is_cli,
			isSupport: actor?.is_happiness,
			isMcpAgent: actor?.is_mcp_agent,
			mcpClient: actor?.mcp_client,
		},
		activityIsRewindable: Boolean( is_rewindable ),
		rewindId: rewind_id || undefined,
	};
};
