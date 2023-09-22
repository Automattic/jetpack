import { Button } from '@automattic/jetpack-components';

export type ShareButtonProps = {
	buttonStyle?: 'icon' | 'text' | 'icon-text';
	buttonVariant?: React.ComponentProps< typeof Button >[ 'variant' ];
};
