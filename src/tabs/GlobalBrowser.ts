import TabBase from "./TabBase.ts";
import htmlSrc from "./GlobalBrowser.html?raw"
import ConstructInspector from "./ConstructInspector.ts";

import { getModuleGlobals, getModuleNames } from "../data.ts";

export default class GlobalBrowser extends TabBase {

	private moduleList: HTMLTableElement;
	private globalList: HTMLTableElement;

	private selectedModule: string = "MAIN";

	constructor() {
		const node = document.createElement("div");
		node.innerHTML = htmlSrc;

		super({node: node});
		this.title.label = "Global Browser"; // global or globals? neither variant sounds good

		this.moduleList = node.querySelector("#globalModuleList") as HTMLTableElement;
		this.globalList = node.querySelector("#globalList") as HTMLTableElement;
	}

	protected override getHardcodedClassName(): string {
		return "GlobalBrowser";
	}

	protected override onBrowserUpdate() {
		const moduleNames = getModuleNames();

		this.moduleList.querySelectorAll("tbody").forEach((e: HTMLTableSectionElement) => e.remove());
		this.globalList.querySelectorAll("tbody").forEach((e: HTMLTableSectionElement) => e.remove());

		const tbody = this.moduleList.createTBody();

		for (const moduleName of moduleNames) {
			const row = tbody.insertRow(-1);
			const module = document.createElement("td");
			module.textContent = moduleName;
			row.append(module);

			row.addEventListener("click", (_) => {
				this.showModuleGlobals(moduleName);
				this.selectedModule = moduleName;
			});

			if (moduleName === this.selectedModule) {
				this.showModuleGlobals(moduleName);
			}
		}
	}

	private showModuleGlobals(moduleName: string) {
		const globals = getModuleGlobals(moduleName);

		this.globalList.querySelectorAll("tbody").forEach((e: HTMLTableSectionElement) => e.remove());

		const tbody = this.globalList.createTBody();

		for (const global of globals) {
			const row = tbody.insertRow(-1);

			const name = document.createElement("td");
			const value = document.createElement("td");

			name.textContent = "?*" + global.name + "*";
			value.textContent = global.value;

			row.append(name, value);

			row.addEventListener("click", (_) => {
				TabBase.getInstance(ConstructInspector).showDefglobal(moduleName, global.name);
			});
		}
	}
}
