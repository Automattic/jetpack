export type EmailState = { [ id: number ]: Contact };

export type Contact = {
	contact_id: number;
	name: string;
	status: string;
	prefix: string;
	email: string;
	phone: string;
	avatar: string;
	transactions_value: string;
	invoices_value: string;
	quotes_value: string;
};

export type Message = {
	id: number;
	sender_contact_id: number;
	subject: string;
	content: string;
	type: string;
	sent_date: string;
};
