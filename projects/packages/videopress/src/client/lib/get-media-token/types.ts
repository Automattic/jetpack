export const MEDIA_TOKEN_SCOPES = [ 'upload' ] as const;
type MediaTokenScopesProps = typeof MEDIA_TOKEN_SCOPES;
export type MediaTokenScopeProps = MediaTokenScopesProps[ number ];

export type mediaTokenUploadActionProp = 'videopress-get-upload-token';

export type MediaTokenScopeAdminAjaxResponseBodyProps = {
	upload_token: string;
	upload_blog_id: string;
	upload_action_url: string;
};

export type mediaTokenProps = {
	token: string;
	blogId: string;
	url: string;
};
