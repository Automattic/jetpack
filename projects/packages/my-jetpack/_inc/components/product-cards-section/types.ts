import type { FC } from 'react';

export type ProductCardComponent = FC< {
	admin: boolean;
	recommendation?: boolean;
} >;
