import TabBase from "./TabBase.ts";
import htmlSrc from "./FactBrowser.html?raw"

import { Module, Environment } from "../logic.ts";

type FactData = Array<{ slot: string | undefined, value: string }>;

type Fact = {
	index: number,
	template: string,
	data: FactData
};

// TODO refactor and optimize this garbage
export default class FactBrowser extends TabBase {

	private moduleList: HTMLTableElement;
	private factList: HTMLTableElement;
	private valueList: HTMLTableElement;

	private selectedModule: string = "MAIN";
	private lastSelectedFactIndex: number = 0;

	constructor() {
		let node = document.createElement("div");
		node.innerHTML = htmlSrc;

		super({node: node});

		this.title.label = "Fact Browser";

		this.moduleList = node.querySelector("#moduleList") as HTMLTableElement;
		this.factList = node.querySelector("#factList") as HTMLTableElement;
		this.valueList = node.querySelector("#valueList") as HTMLTableElement;
	}

	protected override onBrowserUpdate() {
		let moduleNames: Array<string> = [];

		let arrayPtr = Module._GetDefmoduleNames(Environment);
		let originalPtr = arrayPtr;
		let strPtr = 0;
		while (true) {
			strPtr = Module.getValue(arrayPtr, "i32");
			if (!strPtr) { break; }
			arrayPtr += 4;
			moduleNames.push(Module.UTF8ToString(strPtr));
		}
		Module._free(originalPtr);

		this.moduleList.querySelectorAll("tbody").forEach((e: HTMLTableSectionElement) => e.remove());
		this.factList.querySelectorAll("tbody").forEach((e: HTMLTableSectionElement) => e.remove());
		this.valueList.querySelectorAll("tbody").forEach((e: HTMLTableSectionElement) => e.remove());

		let tbody = this.moduleList.createTBody();
		for (const moduleName of moduleNames) {
			let row = tbody.insertRow(-1);
			let module = document.createElement("td");
			module.textContent = moduleName;
			row.append(module);

			row.addEventListener("click", (_) => {
				this.showModuleFacts(moduleName);
				this.selectedModule = moduleName;
			});

			if (moduleName === this.selectedModule) {
				this.showModuleFacts(moduleName);
			}
		}
	}

	private showModuleFacts(moduleName: string) {
		let facts: Array<Fact> = [];

		let dataPtr = Module.GetModuleFacts(Environment, moduleName);
		let originalPtr = dataPtr;
		while (true) {
			let index = Module.getValue(dataPtr, "i32");
			if (index == -1) { break; }
			dataPtr += 4;

			let template = Module.UTF8ToString(Module.getValue(dataPtr, "i32"));
			dataPtr += 4;

			let slotArrayPtr = Module.getValue(dataPtr, "i32");
			dataPtr += 4;

			let valueArrayPtr = Module.getValue(dataPtr, "i32");
			dataPtr += 4;

			let factData: FactData = [];

			let originalSAPtr = 0;
			if (slotArrayPtr) {
				originalSAPtr = slotArrayPtr;
			}

			if (valueArrayPtr) {
				let originalVAPtr = valueArrayPtr;
				while (true) {
					let valueStrPtr = Module.getValue(valueArrayPtr, "i32");
					if (!valueStrPtr) { break; }
					valueArrayPtr += 4;
					let value = Module.UTF8ToString(valueStrPtr);
					Module._free(valueStrPtr);
					let slot: string | undefined = undefined;
					if (slotArrayPtr) {
						let slotStrPtr = Module.getValue(slotArrayPtr, "i32");
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

		this.factList.querySelectorAll("tbody").forEach((e: HTMLTableSectionElement) => e.remove());
		let tbody = this.factList.createTBody();

		for (let i = 0; i < facts.length; i++) {
			let fact = facts[i];
			let row = tbody.insertRow(-1);

			let index = document.createElement("td");
			let template = document.createElement("td");

			index.textContent = "f-" + fact.index;
			template.textContent = fact.template;

			row.append(index);
			row.append(template);

			row.addEventListener("click", (_) => {
				this.lastSelectedFactIndex = fact.index;
				this.showFact(fact.data);
			});

			if (fact.index == this.lastSelectedFactIndex) {
				this.showFact(fact.data);
			}
		}
	}

	private showFact(factData: FactData) {
		this.valueList.querySelectorAll("tbody").forEach((e: HTMLTableSectionElement) => e.remove());
		let tbody = this.valueList.createTBody();

		for (const sv of factData) {
			let row = tbody.insertRow(-1);

			let slot = document.createElement("td");
			let value = document.createElement("td");

			slot.textContent = (sv.slot === undefined) ? "implied" : sv.slot;
			value.textContent = sv.value;

			row.append(slot);
			row.append(value);
		}
	}
}

