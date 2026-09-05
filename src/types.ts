export type AgendaEntry = { salience: number, rule: string, basis: string };

export type FactData = Array<{ slot: string | undefined, value: string }>;
export type Fact = {
	index: number,
	template: string,
	data: FactData
};

export type InstanceData = Array<{ slot: string, value: string }>;
export type Instance = {
	name: string,
	class: string,
	data: InstanceData
};

export type Global = { name: string, value: string };
