export type SubscriberTotals = {
	all: number;
	paid: number;
};

export type SubscriberTotalsByDate = Record< string, SubscriberTotals >;

export type ChartSubscriptionDataPoint = {
	date: Date;
	all: number;
	paid: number;
};
