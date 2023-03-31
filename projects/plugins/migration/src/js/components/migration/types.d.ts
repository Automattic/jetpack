export type MigrationStatus = {
	status: 'inactive' | 'backing-up' | 'restoring' | 'error';
	errorCode?: string;
	source_blog_id?: string;
	target_blog_id?: string;
	percent?: number;
	created?: string;
	last_modified?: string;
	is_atomic?: boolean;
};

export type ErrorResponse = {
	code: string;
	data: null | object;
	message: string;
};
