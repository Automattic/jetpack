import {
	Container,
	Col,
	H3,
	Text,
	SocialIcon,
	getUserLocale,
} from '@automattic/jetpack-components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { Icon, edit, lifesaver } from '@wordpress/icons';
import { STORE_ID } from '../../store';
import StatCards from '../stat-cards';
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
	const sharesCount = useSelect(
		select => select( STORE_ID ).getSharesCount()?.results?.total ?? null
	);

	const formatter = Intl.NumberFormat( getUserLocale(), {
		notation: 'compact',
		compactDisplay: 'short',
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
			<Col sm={ 4 } md={ 4 } lg={ { start: 7, end: 12 } }>
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
			</Col>
		</Container>
	);
};

export default Header;
