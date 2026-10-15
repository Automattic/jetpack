import { EarnPage } from '../../src/features/wpcom-earn/js/page.tsx';
import { Placeholder } from '../../src/features/wpcom-earn/js/placeholder.tsx';

const Stage = () => {
	return (
		<EarnPage active="paid-subscriptions">
			<Placeholder section="paid-subscriptions" />
		</EarnPage>
	);
};

export { Stage as stage };
