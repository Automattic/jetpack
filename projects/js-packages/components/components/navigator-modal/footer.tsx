import { Button, Flex, FlexBlock, FlexItem, useNavigator } from '@wordpress/components';
import { useCallback, useContext } from 'react';
import { NavigatorModalContext } from './context.ts';
import styles from './styles.module.scss';
import { SharedProps } from './types.ts';

export type FooterProps = SharedProps & {
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
export function Footer( { children, actions, isScreenLocked }: FooterProps ) {
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
		<Flex className={ styles.footer }>
			<FlexBlock>{ children }</FlexBlock>
			{ actions ? (
				<FlexItem>
					<Flex>
						{ actions.map( ( props, index ) => {
							if ( typeof props === 'function' ) {
								return props( { navigate } );
							}

							return (
								<Button
									key={ index }
									{ ...props }
									// eslint-disable-next-line react/jsx-no-bind
									onClick={ event => {
										props.onClick?.( event );
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
