import TabBase from "./TabBase.ts";
import htmlSrc from "./FactBrowser.html?raw"
import ConstructInspector from "./ConstructInspector.ts";

import { getModuleFacts, getModuleNames } from "../data.ts";
import type { FactData } from "../types.ts";

export default class FactBrowser extends TabBase {

	private moduleList: HTMLTableElement;
	private factList: HTMLTableElement;
	private valueList: HTMLTableElement;

	private selectedModule: string = "MAIN";
	private lastSelectedFactIndex: number = 0;
	private lastSelectedFactPosition: number = 0;

	constructor() {
		const node = document.createElement("div");
		node.innerHTML = htmlSrc;

		super({node: node});

		this.title.label = "Fact Browser";

		this.moduleList = node.querySelector("#factModuleList") as HTMLTableElement;
		this.factList = node.querySelector("#factList") as HTMLTableElement;
		this.valueList = node.querySelector("#factValueList") as HTMLTableElement;
	}

	protected override getHardcodedClassName(): string {
		return "FactBrowser";
	}

	protected override onBrowserUpdate() {
		const moduleNames = getModuleNames();

		this.moduleList.querySelectorAll("tbody").forEach((e: HTMLTableSectionElement) => e.remove());
		this.factList.querySelectorAll("tbody").forEach((e: HTMLTableSectionElement) => e.remove());
		this.valueList.querySelectorAll("tbody").forEach((e: HTMLTableSectionElement) => e.remove());

		const tbody = this.moduleList.createTBody();

		for (const moduleName of moduleNames) {
			const row = tbody.insertRow(-1);
			const module = document.createElement("td");
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
		const facts = getModuleFacts(moduleName);

		this.factList.querySelectorAll("tbody").forEach((e: HTMLTableSectionElement) => e.remove());

		const tbody = this.factList.createTBody();

		for (let i = 0; i < facts.length; i++) {
			const fact = facts[i];
			const row = tbody.insertRow(-1);

			const index = document.createElement("td");
			const template = document.createElement("td");

			index.textContent = "f-" + fact.index;
			template.textContent = fact.template;

			row.append(index);
			row.append(template);

			row.addEventListener("click", (_) => {
				this.lastSelectedFactIndex = fact.index;
				this.lastSelectedFactPosition = i;
				this.showFact(fact.data);
				TabBase.getInstance(ConstructInspector).showDeftemplate(moduleName, fact.template);
			});

		}

		let factDisplayed = false;
		for (const fact of facts) {
			if (fact.index === this.lastSelectedFactIndex) {
				this.showFact(fact.data);
				factDisplayed = true;
			}
		}
		if (!factDisplayed) {
			// Seems the previously displayed fact is gone. Try to show something, at least?
			for (let i = 0; i < facts.length; i++) {
				if (i === this.lastSelectedFactPosition) {
					this.showFact(facts[i].data);
				}
			}
		}
	}

	private showFact(factData: FactData) {
		this.valueList.querySelectorAll("tbody").forEach((e: HTMLTableSectionElement) => e.remove());

		const tbody = this.valueList.createTBody();

		for (const sv of factData) {
			const row = tbody.insertRow(-1);

			const slot = document.createElement("td");
			const value = document.createElement("td");

			slot.textContent = (sv.slot === undefined) ? "implied" : sv.slot;
			value.textContent = sv.value;

			row.append(slot);
			row.append(value);
		}
	}
}

