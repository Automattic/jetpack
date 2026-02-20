import { Button, Flex, FlexBlock, FlexItem, useNavigator } from '@wordpress/components';
import clsx from 'clsx';
import { useCallback, useContext } from 'react';
import { NavigatorModalContext } from './context.ts';

export type FooterProps = React.HTMLAttributes< HTMLDivElement > & {
	actions?: Array<
		| ( ( props: { navigate: VoidFunction } ) => React.ReactElement )
		| React.ComponentProps< typeof Button >
	>;
	isScreenLocked?: boolean;
};

/**
 * Renders a footer.
 *
 * @param {FooterProps} props - Props
 *
 * @return The rendered footer.
 */
export function Footer( { children, actions, isScreenLocked, className, ...props }: FooterProps ) {
	const navigator = useNavigator();
	const context = useContext( NavigatorModalContext );

	const navigate = useCallback( () => {
		if ( ! isScreenLocked ) {
			navigator.goBack();
		} else {
			context.onClose?.();
		}
	}, [ isScreenLocked, navigator, context ] );

	return (
		<Flex className={ clsx( 'jp-navigator-modal__footer', className ) } { ...props }>
			<FlexBlock>{ children }</FlexBlock>
			{ actions ? (
				<FlexItem>
					<Flex>
						{ actions.map( ( action, index ) => {
							if ( typeof action === 'function' ) {
								return action( { navigate } );
							}

							return (
								<Button
									key={ index }
									{ ...action }
									// eslint-disable-next-line react/jsx-no-bind
									onClick={ event => {
										action.onClick?.( event );
										navigate();
									} }
								/>
							);
						} ) }
					</Flex>
				</FlexItem>
			) : null }
		</Flex>
	);
}
