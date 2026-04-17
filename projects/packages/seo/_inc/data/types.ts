export interface WP_Error {
	code: string;
	message: string;
	data?: { status?: number } & Record< string, unknown >;
}
