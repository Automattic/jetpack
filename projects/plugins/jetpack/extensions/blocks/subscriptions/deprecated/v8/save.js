import clsx from 'clsx';

export default function Save( { className, attributes } ) {
	const { showSubscribersTotal, buttonOnNewLine } = attributes;

	const getBlockClassName = () => {
		return clsx(
			className,
			'wp-block-jetpack-subscriptions__supports-newline',
			buttonOnNewLine ? 'wp-block-jetpack-subscriptions__use-newline' : undefined,
			showSubscribersTotal ? 'wp-block-jetpack-subscriptions__show-subs' : undefined
		);
	};
	return <div className={ getBlockClassName() }></div>;
}
