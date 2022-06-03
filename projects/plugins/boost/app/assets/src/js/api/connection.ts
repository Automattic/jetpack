import api from './api';

export async function getOptimizationsStatus(): Promise< void > {
	return await api.get( '/optimizations/status' );
}
