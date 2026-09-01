export const parseErrorMessage = ( error: unknown, fallback: string ): string => {
	const message = ( error as { message?: unknown } )?.message;
	return typeof message === 'string' ? message : fallback;
};
