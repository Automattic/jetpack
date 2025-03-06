export type DailySubscriptionStat = {
	all: number;
	paid: number;
};

export type DailySubscriptionStats = Record< string, DailySubscriptionStat >;

export type SubscriptionStat = {
	date: Date;
	all: number;
	paid: number;
};
