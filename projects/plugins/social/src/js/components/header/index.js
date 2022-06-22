import { Container, Col, H3, Text, Spinner } from '@automattic/jetpack-components';
import { useSelect, useDispatch } from '@wordpress/data';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, edit } from '@wordpress/icons';
import { STORE_ID } from '../../store';
import styles from './styles.module.scss';

const Actions = ( { actions } ) => (
	<div className={ styles.actions }>
		{ actions.map( ( { link, label, icon } ) => (
			<Text key={ label }>
				<a href={ link } className={ styles.action }>
					{ icon && <Icon icon={ icon } size={ 16 } /> }
					{ label }
				</a>
			</Text>
		) ) }
	</div>
);
const Header = () => {
	useDispatch( STORE_ID ).getSharesCount();
	const { sharesCountResponse } = useSelect( select => {
		const store = select( STORE_ID );
		return {
			sharesCountResponse: store.getSharesCount(),
		};
	} );
	const sharesCountLoaded = sharesCountResponse && sharesCountResponse.results;
	const sharesCount = sharesCountLoaded ? sharesCountResponse.results.total : 0;
	const text = createInterpolateElement(
		sprintf(
			// translators: %1$d is the number of shares used.
			__( 'You’ve made <boldText>%1$d</boldText> shares over the past 30 days.', 'jetpack-social' ),
			sharesCount
		),
		{
			boldText: <strong />,
		}
	);

	const actions = [
		{
			link: '/wp-admin/post-new.php',
			label: __( 'Write a post', 'jetpack-social' ),
			icon: edit,
		},
	];
	return (
		<Container horizontalSpacing={ 3 } horizontalGap={ 7 } className={ styles.container }>
			<Col sm={ 4 } md={ 4 } lg={ 5 }>
				<H3 mt={ 2 }>{ __( 'Post everywhere', 'jetpack-social' ) }</H3>
				{ sharesCountLoaded ? (
					<Text className={ styles.title }>{ text }</Text>
				) : (
					<Spinner color="#000" size={ 32 } />
				) }
				<Actions actions={ actions } />
			</Col>
		</Container>
	);
};

export default Header;
