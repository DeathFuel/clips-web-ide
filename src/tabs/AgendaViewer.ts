import TabBase from "./TabBase.ts";
import htmlSrc from "./AgendaViewer.html?raw"

import { Module, Environment } from "../logic.ts";
import { getAgendaData, getFocusStackNames } from "../data.ts";

export default class AgendaViewer extends TabBase {

	private focusStack: HTMLTableElement;
	private agenda: HTMLTableElement;

	private selectedModule: string = "MAIN";

	constructor() {
		const node = document.createElement("div");
		node.innerHTML = htmlSrc;

		super({node: node});

		this.title.label = "Agenda Viewer";

		const clickable = (sel: string, fn: (e: PointerEvent) => void) => {
			(node.querySelector(sel) as HTMLButtonElement).addEventListener("click", fn);
		}

		clickable("#resetButton", (_) => { Module.LoadAndExecute(Environment, "(reset)"); });
		clickable("#runButton", (_) => { Module.LoadAndExecute(Environment, "(run)"); });
		clickable("#stepButton", (_) => { Module.LoadAndExecute(Environment, "(run 1)"); });

		this.focusStack = node.querySelector("#focusStack") as HTMLTableElement;
		this.agenda = node.querySelector("#agenda") as HTMLTableElement;
	}

	protected override onBrowserUpdate() {
		const focusStackNames = getFocusStackNames();

		this.focusStack.querySelectorAll("tbody").forEach((e: HTMLTableSectionElement) => e.remove());
		this.agenda.querySelectorAll("tbody").forEach((e: HTMLTableSectionElement) => e.remove());
		const tbody = this.focusStack.createTBody();

		for (const moduleName of focusStackNames) {
			const row = tbody.insertRow(-1);
			const module = document.createElement("td");
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
		const agendaData = getAgendaData(moduleName);

		this.agenda.querySelectorAll("tbody").forEach((e: HTMLTableSectionElement) => e.remove());
		const tbody = this.agenda.createTBody();

		for (const agendaElem of agendaData) {
			const row = tbody.insertRow(-1);

			const salience = document.createElement("td");
			const rule = document.createElement("td");
			const basis = document.createElement("td");

			salience.textContent = agendaElem.salience.toString();
			rule.textContent = agendaElem.rule;
			basis.textContent = agendaElem.basis;

			row.append(salience);
			row.append(rule);
			row.append(basis);
		}
	}
}

