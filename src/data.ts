import { Module, Environment } from "./logic.ts";
import type { AgendaEntry, Fact, FactData, Global, Instance, InstanceData } from "./types.ts";

// Length-prefixed array of null-terminated strings that do NOT get freed
function readStringArray(arrayPtr: number): Array<string> {
	const array: Array<string> = []

	const originalPtr = arrayPtr;
	const count = Module.getValue(arrayPtr, "i32");
	for (let i = 0; i < count; i++) {
		arrayPtr += 4;
		const strPtr = Module.getValue(arrayPtr, "i32");
		const str = Module.UTF8ToString(strPtr); 
		array.push(str);
	}
	Module._free(originalPtr);

	return array;
}

export function getFocusStackNames(): Array<string> {
	const ptr = Module._GetFocusStackModuleNames(Environment);
	return readStringArray(ptr);
}

export function getModuleNames(): Array<string> {
	const ptr = Module._GetDefmoduleNames(Environment);
	return readStringArray(ptr);
}

export function getAgendaData(moduleName: string): Array<AgendaEntry> {
	const agendaData: Array<AgendaEntry> = [];

	let dataPtr = Module.GetModuleAgenda(Environment, moduleName);
	const originalPtr = dataPtr;
	const count = Module.getValue(dataPtr, "i32");
	for (let i = 0; i < count; i++) {
		dataPtr += 4;
		const salience = Module.getValue(dataPtr, "i32");

		dataPtr += 4;
		const rulePtr = Module.getValue(dataPtr, "i32");

		dataPtr += 4;
		const basisPtr = Module.getValue(dataPtr, "i32");

		agendaData.push({
			salience: salience,
			rule: Module.UTF8ToString(rulePtr),
			basis: Module.UTF8ToString(basisPtr)
		});

		Module._free(basisPtr);
	}
	Module._free(originalPtr);

	return agendaData;
}

export function getModuleFacts(moduleName: string): Array<Fact> {
	const facts: Array<Fact> = [];

	let dataPtr = Module.GetModuleFacts(Environment, moduleName);
	const originalPtr = dataPtr;
	const count = Module.getValue(dataPtr, "i32");

	for (let i = 0; i < count; i++) {
		dataPtr += 4;
		const index = Module.getValue(dataPtr, "i32");

		dataPtr += 4;
		const template = Module.UTF8ToString(Module.getValue(dataPtr, "i32"));

		dataPtr += 4;
		let slotArrayPtr = Module.getValue(dataPtr, "i32");

		dataPtr += 4;
		let valueArrayPtr = Module.getValue(dataPtr, "i32");

		const factData: FactData = [];

		let originalSAPtr = 0;
		if (slotArrayPtr) {
			originalSAPtr = slotArrayPtr;
		}

		if (valueArrayPtr) {
			const originalVAPtr = valueArrayPtr;
			while (true) {
				const valueStrPtr = Module.getValue(valueArrayPtr, "i32");
				if (!valueStrPtr) { break; }
				valueArrayPtr += 4;
				const value = Module.UTF8ToString(valueStrPtr);
				Module._free(valueStrPtr);
				let slot: string | undefined = undefined;
				if (slotArrayPtr) {
					const slotStrPtr = Module.getValue(slotArrayPtr, "i32");
					slotArrayPtr += 4;
					slot = Module.UTF8ToString(slotStrPtr);
				}
				factData.push({ slot: slot, value: value });
			}
			Module._free(originalVAPtr);
		}

		if (originalSAPtr) {
			Module._free(originalSAPtr);
		}

		facts.push({ index: index, template: template, data: factData });
	}
	Module._free(originalPtr);

	return facts;
}

export function getModuleInstances(moduleName: string): Array<Instance> {
	const instances: Array<Instance> = [];

	let dataPtr = Module.GetModuleInstances(Environment, moduleName);
	const originalPtr = dataPtr;
	const count = Module.getValue(dataPtr, "i32");

	for (let i = 0; i < count; i++) {
		dataPtr += 4;
		const name = Module.UTF8ToString(Module.getValue(dataPtr, "i32"));

		dataPtr += 4;
		const cls = Module.UTF8ToString(Module.getValue(dataPtr, "i32"));

		dataPtr += 4;
		let slotArrayPtr = Module.getValue(dataPtr, "i32");

		dataPtr += 4;
		let valueArrayPtr = Module.getValue(dataPtr, "i32");

		const instanceData: InstanceData = [];

		const originalSAPtr = slotArrayPtr;
		const originalVAPtr = valueArrayPtr;

		if (valueArrayPtr) {
			while (true) {
				const valueStrPtr = Module.getValue(valueArrayPtr, "i32");
				if (!valueStrPtr) { break; }
				valueArrayPtr += 4;
				const value = Module.UTF8ToString(valueStrPtr);
				Module._free(valueStrPtr);
				let slot = "";
				if (slotArrayPtr) {
					const slotStrPtr = Module.getValue(slotArrayPtr, "i32");
					slotArrayPtr += 4;
					slot = Module.UTF8ToString(slotStrPtr);
				}
				instanceData.push({ slot: slot, value: value });
			}
		}

		if (originalSAPtr) {
			Module._free(originalSAPtr);
		}

		if (originalVAPtr) {
			Module._free(originalVAPtr);
		}

		instances.push({ name: name, class: cls, data: instanceData });
	}
	Module._free(originalPtr);

	return instances;
}

export function getModuleGlobals(moduleName: string): Array<Global> {
	const globals: Array<Global> = [];

	let dataPtr = Module.GetModuleGlobals(Environment, moduleName);
	const originalPtr = dataPtr;
	const count = Module.getValue(dataPtr, "i32");
	for (let i = 0; i < count; i++) {
		dataPtr += 4;
		const namePtr = Module.getValue(dataPtr, "i32");
		const name = Module.UTF8ToString(namePtr);

		dataPtr += 4;
		const valueStrPtr = Module.getValue(dataPtr, "i32");
		const value = Module.UTF8ToString(valueStrPtr);
		Module._free(valueStrPtr);

		globals.push({ name: name, value: value });
	}
	Module._free(originalPtr);

	return globals;
}

export function getDeftemplateText(moduleName: string, templateName: string): string {
	const ptr = Module.GetDeftemplateText(Environment, moduleName, templateName);
	return ptr ? Module.UTF8ToString(ptr) : "";
}

export function getDefclassText(moduleName: string, className: string): string {
	const ptr = Module.GetDefclassText(Environment, moduleName, className);
	return ptr ? Module.UTF8ToString(ptr) : "";
}

export function getDefruleText(moduleName: string, ruleName: string): string {
	const ptr = Module.GetDefruleText(Environment, moduleName, ruleName);
	return ptr ? Module.UTF8ToString(ptr) : "";
}

export function getDefglobalText(moduleName: string, globalName: string): string {
	const ptr = Module.GetDefglobalText(Environment, moduleName, globalName);
	return ptr ? Module.UTF8ToString(ptr) : "";
}
