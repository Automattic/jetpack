/**
 * WordPress dependencies
 */
import { Path, SVG, Circle, G, Rect } from '@wordpress/components';

/**
 * Internal dependencies
 */
import PaidSymbol from './paid-symbol';

const paidBlockClassName = 'jetpack-paid-block-icon';

const simplePaymentsPaidIcon = (
	<SVG className={ paidBlockClassName } xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Path fill="none" d="M0 0h24v24H0V0z" />
		<Path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
		<PaidSymbol />
	</SVG>
);

const recurringPaymentsPaidIcon = (
	<SVG
		className={ paidBlockClassName }
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		width="24"
		height="24"
	>
		<Rect x="0" fill="none" width="24" height="24" />
		<G>
			<Path d="M20 4H4c-1.105 0-2 .895-2 2v12c0 1.105.895 2 2 2h16c1.105 0 2-.895 2-2V6c0-1.105-.895-2-2-2zm0 2v2H4V6h16zM4 18v-6h16v6H4zm2-4h7v2H6v-2zm9 0h3v2h-3v-2z" />
		</G>
		<PaidSymbol />
	</SVG>
);

const calendlyPaidIcon = (
	<SVG
		className={ paidBlockClassName }
		height="24"
		viewBox="0 0 23 24"
		width="23"
		xmlns="http://www.w3.org/2000/svg"
	>
		<G fill="none" fillRule="evenodd">
			<Rect
				height="20.956522"
				rx="3"
				stroke="#656a74"
				strokeWidth="2"
				width="20.956522"
				x="1"
				y="2.043478"
			/>
			<Rect fill="#656a74" height="4.869565" rx="1" width="2" x="6.565217" />
			<Rect fill="#656a74" height="4.869565" rx="1" width="2" x="14.652174" />
			<Path
				d="m14.6086957 10.0869565c-.6956522-.57971012-1.6231885-.8695652-2.7826087-.8695652-1.7391305 0-3.47826091 1.5652174-3.47826091 3.6521739s1.73913041 3.6521739 3.47826091 3.6521739c1.1594202 0 2.0869565-.3478261 2.7826087-1.0434782"
				stroke="#656a74"
			/>
		</G>
		<PaidSymbol />
	</SVG>
);

const openTablePaidIcon = (
	<SVG
		className={ paidBlockClassName }
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 22 16"
		fill="none"
		height="16"
		width="22"
	>
		<Path
			fill="#555d66"
			d="m1.997 5.982c-.39457-.00039-.7804.11622-1.108699.33511-.328295.21888-.584312.5302-.735674.89459-.15136174.36439-.1912714.76548-.1146819 1.15254.0765899.38707.2662379.74274.5449639 1.02202.278726.27929.634011.46965 1.020921.54702.38692.07732.78809.03826 1.15278-.11238.36469-.15063.67652-.40602.89606-.73387.21954-.32786.33693-.71345.33733-1.10803v-.002c.001-1.1-.89-1.994-1.992-1.995zm12.006 3.988c-.3946.0004-.7805-.11625-1.1088-.33517-.3283-.21893-.5843-.53031-.7357-.89476-.1513-.36444-.1912-.76558-.1145-1.15268s.2664-.74276.5453-1.022c.2788-.27925.6342-.46953 1.0211-.54679.387-.07725.7882-.038 1.1529.11278.3647.15079.6764.40634.8959.73432.2194.32799.3366.71369.3368 1.1083v.003c.0003.52814-.2092 1.03477-.5824 1.4085s-.8795.58397-1.4076.5845zm0-9.96999843c-1.5777-.0009886-3.1203.46588743-4.43262 1.34158843-1.31236.8757-2.33558 2.1209-2.94025 3.57813-.60467 1.45722-.76365 3.06103-.45683 4.60861.30683 1.54757 1.06567 2.96947 2.18058 4.08577 1.1149 1.1163 2.53582 1.8769 4.08302 2.1856 1.5472.3088 3.1512.1518 4.6091-.451 1.458-.6028 2.7045-1.6245 3.5819-2.9358.8773-1.3112 1.3461-2.8532 1.3471-4.4309v-.005c.0008-2.11466-.8384-4.14304-2.3331-5.63899-1.4946-1.495952-3.5222-2.3369478-5.6369-2.33800843z"
		/>
		<PaidSymbol cx="24" cy="0" />
	</SVG>
);

const sendAMesssagePaidIcon = (
	<SVG
		className={ paidBlockClassName }
		xmlns="http://www.w3.org/2000/svg"
		width="24"
		height="24"
		viewBox="0 0 24 24"
	>
		<Path fill="none" d="M0 0h24v24H0V0z" />
		<Path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z" />
		<PaidSymbol />
	</SVG>
);

const whatsappButtonPaidIcon = (
	<SVG width="24" height="24" viewBox="0 0 24 24" version="1.1">
		<Path d="M24,11.6909333 C24,18.1477333 18.7256,23.3818667 12.2181333,23.3818667 C10.1522667,23.3818667 8.21146667,22.8538667 6.52293333,21.9272 L0,24 L2.12666667,17.7274667 C1.05386667,15.9658667 0.436,13.8997333 0.436,11.6909333 C0.436,5.23413333 5.71093333,0 12.2181333,0 C18.7261333,0 24,5.23413333 24,11.6909333 Z M12.2181333,1.86186667 C6.75573333,1.86186667 2.31253333,6.2712 2.31253333,11.6909333 C2.31253333,13.8416 3.0136,15.8333333 4.19946667,17.4536 L2.96186667,21.104 L6.76853333,19.8941333 C8.33253333,20.9210667 10.2061333,21.52 12.2184,21.52 C17.68,21.52 22.124,17.1112 22.124,11.6914667 C22.124,6.27173333 17.6802667,1.86186667 12.2181333,1.86186667 Z M18.1677333,14.3834667 C18.0949333,14.2642667 17.9026667,14.1922667 17.6141333,14.0490667 C17.3250667,13.9058667 15.9048,13.2122667 15.6408,13.1170667 C15.376,13.0216 15.1829333,12.9736 14.9906667,13.2602667 C14.7984,13.5472 14.2448,14.1922667 14.076,14.3834667 C13.9074667,14.5752 13.7392,14.5992 13.4501333,14.4557333 C13.1616,14.3125333 12.2312,14.0096 11.128,13.0336 C10.2696,12.2741333 9.68986667,11.3365333 9.52133333,11.0493333 C9.35306667,10.7626667 9.50373333,10.6077333 9.648,10.4650667 C9.77813333,10.3365333 9.93706667,10.1304 10.0813333,9.9632 C10.2261333,9.79573333 10.2741333,9.67653333 10.3698667,9.48506667 C10.4666667,9.29386667 10.4184,9.12666667 10.3458667,8.98293333 C10.2738667,8.83973333 9.69573333,7.4296 9.4552,6.85573333 C9.21466667,6.2824 8.9744,6.37786667 8.8056,6.37786667 C8.63733333,6.37786667 8.44453333,6.35386667 8.252,6.35386667 C8.05946667,6.35386667 7.7464,6.4256 7.4816,6.71226667 C7.21706667,6.9992 6.4712,7.69253333 6.4712,9.1024 C6.4712,10.5125333 7.5056,11.8749333 7.6504,12.0658667 C7.79466667,12.2568 9.64773333,15.2445333 12.5837333,16.392 C15.52,17.5389333 15.52,17.1562667 16.0496,17.1082667 C16.5786667,17.0605333 17.7578667,16.4152 17.9994667,15.7464 C18.2394667,15.0765333 18.2394667,14.5029333 18.1677333,14.3834667 Z" />
		<PaidSymbol />
	</SVG>
);

const premiumContentPaidIcon = (
	<SVG
		className={ paidBlockClassName }
		width="25"
		height="24"
		viewBox="0 0 25 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<Path
			d="M12.7439 14.4271L8.64053 13.165L8.51431 13.8718L8.09208 20.7415C8.06165 21.2365 8.61087 21.5526 9.02363 21.2776L12.7439 18.799L16.7475 21.304C17.1687 21.5676 17.7094 21.2343 17.6631 20.7396L17.0212 13.8718L17.0212 13.165L12.7439 14.4271Z"
			fill="black"
		/>
		<Circle cx="12.7439" cy="8.69796" r="5.94466" stroke="black" strokeWidth="1.5" fill="none" />
		<Path
			d="M9.71023 8.12461L11.9543 10.3687L15.7776 6.54533"
			stroke="black"
			strokeWidth="1.5"
			fill="none"
		/>
		<PaidSymbol />
	</SVG>
);

const donationPaidIcon = (
	<SVG width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
		<Path
			d="M12.7439 14.4271L8.64053 13.165L8.51431 13.8718L8.09208 20.7415C8.06165 21.2365 8.61087 21.5526 9.02363 21.2776L12.7439 18.799L16.7475 21.304C17.1687 21.5676 17.7094 21.2343 17.6631 20.7396L17.0212 13.8718L17.0212 13.165L12.7439 14.4271Z"
			fill="black"
		/>
		<Circle cx="12.7439" cy="8.69796" r="5.94466" stroke="black" strokeWidth="1.5" fill="none" />
		<Path
			d="M9.71023 8.12461L11.9543 10.3687L15.7776 6.54533"
			stroke="black"
			strokeWidth="1.5"
			fill="none"
		/>
	</SVG>
);

const coreCoverPaidIcon = (
	<SVG className={ paidBlockClassName } xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Path d="M18.7 3H5.3C4 3 3 4 3 5.3v13.4C3 20 4 21 5.3 21h13.4c1.3 0 2.3-1 2.3-2.3V5.3C21 4 20 3 18.7 3zm.8 15.7c0 .4-.4.8-.8.8H5.3c-.4 0-.8-.4-.8-.8V5.3c0-.4.4-.8.8-.8h6.2v8.9l2.5-3.1 2.5 3.1V4.5h2.2c.4 0 .8.4.8.8v13.4z" />
		<PaidSymbol />
	</SVG>
);

const coreVideoPaidIcon = (
	<SVG className={ paidBlockClassName } viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
		<Path d="M18.7 3H5.3C4 3 3 4 3 5.3v13.4C3 20 4 21 5.3 21h13.4c1.3 0 2.3-1 2.3-2.3V5.3C21 4 20 3 18.7 3zm.8 15.7c0 .4-.4.8-.8.8H5.3c-.4 0-.8-.4-.8-.8V5.3c0-.4.4-.8.8-.8h13.4c.4 0 .8.4.8.8v13.4zM10 15l5-3-5-3v6z" />
		<PaidSymbol />
	</SVG>
);

export const PAID_ICONS = {
	'jetpack/simple-payments': simplePaymentsPaidIcon,
	'jetpack/recurring-payments': recurringPaymentsPaidIcon,
	'jetpack/calendly': calendlyPaidIcon,
	'jetpack/opentable': openTablePaidIcon,
	'jetpack/send-a-message': sendAMesssagePaidIcon,
	'jetpack/whatsapp-button': whatsappButtonPaidIcon,
	'a8c/donations': donationPaidIcon,
	'premium-content/container': premiumContentPaidIcon,
	'core/cover': coreCoverPaidIcon,
	'core/video': coreVideoPaidIcon,
};

export function hasPaidIcon( name ) {
	return PAID_ICONS.hasOwnProperty( name );
}

export function getPaidIcon( settings, name ) {
	return hasPaidIcon( name ) ? PAID_ICONS[ name ] : settings.icon;
}
