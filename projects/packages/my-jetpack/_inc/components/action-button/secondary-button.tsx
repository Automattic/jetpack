import { __ } from '@wordpress/i18n';
import { Button, Link } from '@wordpress/ui';
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

	if ( variant === 'link' ) {
		return (
			<Link
				id={ id }
				href={ href ?? '#' }
				openInNewTab={ isExternalLink }
				onClick={ onClick }
				className={ className }
				aria-labelledby={ ariaLabelledBy }
			>
				{ label }
			</Link>
		);
	}

	const sharedProps = {
		variant: variantMap[ variant ],
		size: sizeMap[ size ],
		disabled,
		loading: isLoading,
		loadingAnnouncement,
		onClick,
		className,
		id,
		'aria-labelledby': ariaLabelledBy,
	};

	// @wordpress/ui's Button can't natively render as an anchor, so when we need
	// a link we keep the Button chrome and swap the element via render={<a/>}.
	// Revisit this once a first-class LinkButton exists upstream:
	// https://github.com/WordPress/gutenberg/issues/77098
	if ( href ) {
		return (
			<Button
				{ ...sharedProps }
				nativeButton={ false }
				render={
					<a
						href={ href }
						{ ...( isExternalLink && {
							target: '_blank',
							rel: 'noopener noreferrer',
						} ) }
					/>
				}
			>
				{ label }
			</Button>
		);
	}

	return <Button { ...sharedProps }>{ label }</Button>;
};

export default SecondaryButton;
