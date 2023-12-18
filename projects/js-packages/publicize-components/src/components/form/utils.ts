import { Connection } from '../../social-store/types';

export const checkConnectionCode = ( connection: Connection, code: string ) => {
	return false === connection.is_healthy && code === ( connection.error_code ?? 'broken' );
};
