import { __ } from '@wordpress/i18n';
import { Button, Link, LinkButton } from '@wordpress/ui';
import type { FC, MouseEvent } from 'react';

export type SecondaryButtonProps = {
	href?: string;
	size?: 'normal' | 'compact';
	variant?: 'primary' | 'secondary' | 'link' | 'tertiary';
	label?: string;
	shouldShowButton?: () => boolean;
	onClick?: ( () => void ) | ( ( e: MouseEvent< HTMLElement > ) => void );
	isExternalLink?: boolean;
	disabled?: boolean;
	isLoading?: boolean;
	loadingAnnouncement?: string;
	className?: string;
	id?: string;
	'aria-labelledby'?: string;
};

const variantMap = {
	primary: 'solid',
	secondary: 'outline',
	tertiary: 'minimal',
} as const;

const sizeMap = {
	normal: 'default',
	compact: 'compact',
} as const;

const SecondaryButton: FC< SecondaryButtonProps > = props => {
	const {
		shouldShowButton = () => true,
		size = 'compact',
		variant = 'secondary',
		label = __( 'Learn more', 'jetpack-my-jetpack' ),
		href,
		onClick,
		isExternalLink,
		disabled,
		isLoading,
		loadingAnnouncement,
		className,
		id,
		'aria-labelledby': ariaLabelledBy,
	} = props;

	if ( ! shouldShowButton() ) {
		return null;
	}

	if ( variant === 'link' && href ) {
		return (
			<Link
				id={ id }
				href={ href }
				openInNewTab={ isExternalLink }
				onClick={ onClick }
				className={ className }
				aria-labelledby={ ariaLabelledBy }
			>
				{ label }
			</Link>
		);
	}

	const mappedVariant = variant === 'link' ? 'unstyled' : variantMap[ variant ];

	const sharedProps = {
		variant: mappedVariant,
		size: sizeMap[ size ],
		onClick,
		className,
		id,
		'aria-labelledby': ariaLabelledBy,
	};

	// A loading or disabled control isn't navigable, so keep a real Button for
	// the spinner / disabled chrome. Otherwise LinkButton owns href natively.
	if ( href && ! isLoading && ! disabled ) {
		return (
			<LinkButton { ...sharedProps } href={ href } openInNewTab={ isExternalLink }>
				{ label }
			</LinkButton>
		);
	}

	return (
		<Button
			{ ...sharedProps }
			disabled={ disabled }
			loading={ isLoading }
			loadingAnnouncement={ loadingAnnouncement }
		>
			{ label }
		</Button>
	);
};

export default SecondaryButton;
