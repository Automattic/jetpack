import {
	Container,
	Col,
	H3,
	Text,
	SocialIcon,
	getUserLocale,
} from '@automattic/jetpack-components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, edit, lifesaver } from '@wordpress/icons';
import classnames from 'classnames';
import { STORE_ID } from '../../store';
import StatCards from '../stat-cards';
import illustration from './illustration.svg';
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
	const dispatch = useDispatch( STORE_ID );

	useEffect( () => {
		dispatch.getSharesCount();
	}, [ dispatch ] );

	const { hasConnections, sharesCount } = useSelect( select => {
		const store = select( STORE_ID );
		return {
			hasConnections: store.hasConnections(),
			sharesCount: store.getSharesCount()?.results?.total ?? null,
		};
	} );

	const formatter = Intl.NumberFormat( getUserLocale(), {
		notation: 'compact',
		compactDisplay: 'short',
	} );

	const columnClassname = classnames( {
		[ styles.illustration ]: ! hasConnections,
	} );

	const actions = [
		{
			link: '/wp-admin/post-new.php',
			label: __( 'Write a post', 'jetpack-social' ),
			icon: edit,
		},
		{
			link: 'https://jetpack.com/support/',
			label: __( 'Need help?', 'jetpack-social' ),
			icon: lifesaver,
		},
	];

	return (
		<Container horizontalSpacing={ 3 } horizontalGap={ 7 } className={ styles.container }>
			<Col sm={ 4 } md={ 4 } lg={ 5 }>
				<H3 mt={ 2 }>{ __( 'Post everywhere at any time', 'jetpack-social' ) }</H3>
				<Actions actions={ actions } />
			</Col>
			<Col sm={ 4 } md={ 4 } lg={ { start: 7, end: 12 } } className={ columnClassname }>
				{ hasConnections ? (
					<StatCards
						stats={ [
							{
								icon: <SocialIcon />,
								label: __( 'Total shares this month', 'jetpack-social' ),
								loading: null === sharesCount,
								value: formatter.format( sharesCount ),
							},
						] }
					/>
				) : (
					<img src={ illustration } alt="" />
				) }
			</Col>
		</Container>
	);
};

export default Header;
