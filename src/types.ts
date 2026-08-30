export type AgendaEntry = { salience: number, rule: string, basis: string };

export type FactData = Array<{ slot: string | undefined, value: string }>;
export type Fact = {
	index: number,
	template: string,
	data: FactData
};
