import TabBase from "./TabBase.ts";
import htmlSrc from "./AgendaViewer.html?raw"

import { Module, Environment } from "../logic.ts";

export default class AgendaViewer extends TabBase {

	private focusStack: HTMLTableElement;
	private agenda: HTMLTableElement;

	private selectedModule: string = "MAIN";

	constructor() {
		let node = document.createElement("div");
		node.innerHTML = htmlSrc;

		super({node: node});

		this.title.label = "Agenda Viewer";

		let clickable = (sel: string, fn: (e: PointerEvent) => void) => {
			(node.querySelector(sel) as HTMLButtonElement).addEventListener("click", fn);
		}

		clickable("#resetButton", (_) => { Module.LoadAndExecute(Environment, "(reset)"); });
		clickable("#runButton", (_) => { Module.LoadAndExecute(Environment, "(run)"); });
		clickable("#stepButton", (_) => { Module.LoadAndExecute(Environment, "(run 1)"); });

		this.focusStack = node.querySelector("#focusStack") as HTMLTableElement;
		this.agenda = node.querySelector("#agenda") as HTMLTableElement;
	}

	protected override onBrowserUpdate() {
		let focusStackNames: Array<string> = [];

		let arrayPtr = Module._GetFocusStackModuleNames(Environment);
		let originalPtr = arrayPtr;
		let strPtr = 0;
		while (true) {
			strPtr = Module.getValue(arrayPtr, "i32");
			if (!strPtr) { break; }
			arrayPtr += 4;
			focusStackNames.push(Module.UTF8ToString(strPtr));
		}
		Module._free(originalPtr);

		this.focusStack.querySelectorAll("tbody").forEach((e: HTMLTableSectionElement) => e.remove());
		this.agenda.querySelectorAll("tbody").forEach((e: HTMLTableSectionElement) => e.remove());
		let tbody = this.focusStack.createTBody();

		for (const moduleName of focusStackNames) {
			let row = tbody.insertRow(-1);
			let module = document.createElement("td");
			module.textContent = moduleName;
			row.append(module);

			row.addEventListener("click", (_) => {
				this.showModuleAgenda(moduleName);
				this.selectedModule = moduleName;
			});

			if (moduleName === this.selectedModule) {
				this.showModuleAgenda(moduleName);
			}
		}
	}

	private showModuleAgenda(moduleName: string) {
		let agendaData: Array<{ salience: number, rule: string, basis: string }> = [];

		let dataPtr = Module.GetModuleAgenda(Environment, moduleName);
		let originalPtr = dataPtr;
		while (true) {
			let salience = Module.getValue(dataPtr, "i32");
			if (salience == 0x7FFFFFFF) { break; }
			dataPtr += 4;

			let rulePtr = Module.getValue(dataPtr, "i32");
			dataPtr += 4;

			let basisPtr = Module.getValue(dataPtr, "i32");
			dataPtr += 4;

			agendaData.push({
				salience: salience,
				rule: Module.UTF8ToString(rulePtr),
				basis: Module.UTF8ToString(basisPtr)
			});
			Module._free(basisPtr);
		}
		Module._free(originalPtr);

		this.agenda.querySelectorAll("tbody").forEach((e: HTMLTableSectionElement) => e.remove());
		let tbody = this.agenda.createTBody();

		for (const agendaElem of agendaData) {
			let row = tbody.insertRow(-1);

			let salience = document.createElement("td");
			let rule = document.createElement("td");
			let basis = document.createElement("td");

			salience.textContent = agendaElem.salience.toString();
			rule.textContent = agendaElem.rule;
			basis.textContent = agendaElem.basis;

			row.append(salience);
			row.append(rule);
			row.append(basis);
		}
	}
}

