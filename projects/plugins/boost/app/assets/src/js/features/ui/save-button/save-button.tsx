import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/ui';
import type { FC } from 'react';

type SaveButtonProps = {
	disabled: boolean;
	onClick: () => void;
	className?: string;
};

const SaveButton: FC< SaveButtonProps > = ( { disabled, onClick, className } ) => (
	<Button size="compact" disabled={ disabled } onClick={ onClick } className={ className }>
		{ __( 'Save', 'jetpack-boost' ) }
	</Button>
);

export default SaveButton;
