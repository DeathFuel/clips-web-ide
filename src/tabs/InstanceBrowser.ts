import TabBase from "./TabBase.ts";
import htmlSrc from "./InstanceBrowser.html?raw"
import ConstructInspector from "./ConstructInspector.ts";

import { getModuleInstances, getModuleNames } from "../data.ts";
import type { InstanceData } from "../types.ts";

export default class InstanceBrowser extends TabBase {

	private moduleList: HTMLTableElement;
	private instanceList: HTMLTableElement;
	private valueList: HTMLTableElement;

	private selectedModule: string = "MAIN";
	private lastSelectedInstanceName: string = "";

	constructor() {
		const node = document.createElement("div");
		node.innerHTML = htmlSrc;

		super({node: node});

		this.title.label = "Instance Browser";

		this.moduleList = node.querySelector("#instanceModuleList") as HTMLTableElement;
		this.instanceList = node.querySelector("#instanceList") as HTMLTableElement;
		this.valueList = node.querySelector("#instanceValueList") as HTMLTableElement;
	}

	protected override onBrowserUpdate() {
		const moduleNames = getModuleNames();

		this.moduleList.querySelectorAll("tbody").forEach((e: HTMLTableSectionElement) => e.remove());
		this.instanceList.querySelectorAll("tbody").forEach((e: HTMLTableSectionElement) => e.remove());
		this.valueList.querySelectorAll("tbody").forEach((e: HTMLTableSectionElement) => e.remove());

		const tbody = this.moduleList.createTBody();

		for (const moduleName of moduleNames) {
			const row = tbody.insertRow(-1);
			const module = document.createElement("td");
			module.textContent = moduleName;
			row.append(module);

			row.addEventListener("click", (_) => {
				this.showModuleInstances(moduleName);
				this.selectedModule = moduleName;
			});

			if (moduleName === this.selectedModule) {
				this.showModuleInstances(moduleName);
			}
		}
	}

	private showModuleInstances(moduleName: string) {
		const instances = getModuleInstances(moduleName);

		this.instanceList.querySelectorAll("tbody").forEach((e: HTMLTableSectionElement) => e.remove());

		const tbody = this.instanceList.createTBody();

		for (const instance of instances) {
			const row = tbody.insertRow(-1);

			const name = document.createElement("td");
			const cls = document.createElement("td");

			name.textContent = instance.name;
			cls.textContent = instance.class;

			row.append(name);
			row.append(cls);

			row.addEventListener("click", (_) => {
				this.lastSelectedInstanceName = instance.name;
				this.showInstance(instance.data);
				TabBase.getInstance(ConstructInspector).showDefclass(moduleName, instance.class);
			});
		}

		for (const instance of instances) {
			if (instance.name === this.lastSelectedInstanceName) {
				this.showInstance(instance.data);
			}
		}
	}

	private showInstance(instanceData: InstanceData) {
		this.valueList.querySelectorAll("tbody").forEach((e: HTMLTableSectionElement) => e.remove());

		const tbody = this.valueList.createTBody();

		for (const sv of instanceData) {
			const row = tbody.insertRow(-1);

			const slot = document.createElement("td");
			const value = document.createElement("td");

			slot.textContent = sv.slot;
			value.textContent = sv.value;

			row.append(slot);
			row.append(value);
		}
	}
}

