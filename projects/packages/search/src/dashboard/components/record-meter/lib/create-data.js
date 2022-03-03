/**
 * Generate dummy data for use with Record Meter
 *
 * @returns {object} dummy data object
 */
export default function createData() {
	const data = {
		last_indexed_date: '2021-07-06T19:35:18+00:00',
		post_count: 249,
		post_type_breakdown: {
			post: 104,
			page: 17,
			attachment: 15,
			anotherone: 21,
			averyveryextrasuperlongernamesposttypethatgoesonandonandone: 38,
			more: 22,
			andmore: 4,
			moremoremore: 2,
			andthenmore: 6,
			somany: 20,
		},
	};

	const planInfo = {
		search_subscriptions: [
			{
				ID: '17189738',
				user_id: '6487293',
				blog_id: '186671816',
				product_id: '2105',
				expiry: '2022-07-09',
				subscribed_date: '2021-06-09 07:33:14',
				renew: true,
				auto_renew: true,
				ownership_id: '27808225',
				most_recent_renew_date: '',
				subscription_status: 'active',
				product_name: 'Jetpack Search',
				product_name_en: 'Jetpack Search',
				product_slug: 'jetpack_search_monthly',
				product_type: 'search',
				cost: 19,
				currency: 'NZD',
				bill_period: '31',
				available: 'yes',
				multi: true,
				support_document: null,
				is_instant_search: true,
				// tier: "up_to_1k_records",
				tier: 2000, // this needs work
			},
		],
		supports_instant_search: true,
		supports_only_classic_search: false,
		supports_search: true,
		default_upgrade_bill_period: 'monthly',
	};

	return {
		data: data,
		planInfo: planInfo,
	};
}
