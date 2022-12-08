/**
 * Internal dependencies
 */
import { VideoGUID, VideoId } from '../../block-editor/blocks/video/types';

export const MEDIA_TOKEN_SCOPES = [ 'upload', 'playback' ] as const;
type MediaTokenScopesProps = typeof MEDIA_TOKEN_SCOPES;
export type MediaTokenScopeProps = MediaTokenScopesProps[ number ];

export const TOKEN_ADMIN_AJAX_TYPES = [
	'videopress-get-upload-token',
	'videopress-get-playback-jwt',
] as const;

type AdminAjaxTokensProps = typeof TOKEN_ADMIN_AJAX_TYPES;

export type GetMediaTokenArgsProps = {
	id?: VideoId;
	guid?: VideoGUID;
};

export type AdminAjaxTokenProps = AdminAjaxTokensProps[ number ];

export type MediaTokenScopeAdminAjaxResponseBodyProps = {
	upload_token: string;
	upload_blog_id: string;
	upload_action_url: string;
	jwt: string;
};

export type MediaTokenProps = {
	token: string;
	blogId?: string;
	url?: string;
};
