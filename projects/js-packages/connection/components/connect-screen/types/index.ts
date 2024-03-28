export type WithRequired< T, K extends keyof T > = T & { [ P in K ]-?: T[ P ] };
