import { useModuleSurface } from '$features/module/surface';
import { Button } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { Button as UIButton } from '@wordpress/ui';
import type { FC } from 'react';

type SaveButtonProps = {
	disabled: boolean;
	onClick: () => void;
	className?: string;
};

// Compact design-system button inside a Settings row; the legacy primary button elsewhere.
const SaveButton: FC< SaveButtonProps > = ( { disabled, onClick, className } ) => {
	const label = __( 'Save', 'jetpack-boost' );

	if ( useModuleSurface() === 'row' ) {
		return (
			<UIButton size="compact" disabled={ disabled } onClick={ onClick } className={ className }>
				{ label }
			</UIButton>
		);
	}

	return (
		<Button disabled={ disabled } className={ className } onClick={ onClick }>
			{ label }
		</Button>
	);
};

export default SaveButton;
