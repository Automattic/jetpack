export type FeatureView = 'grid' | 'list';

export const isFeatureView = ( value: string ): value is FeatureView =>
	[ 'grid', 'list' ].includes( value );
