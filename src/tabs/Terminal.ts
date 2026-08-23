import TabBase from "./TabBase.ts";
import htmlSrc from "./Terminal.html?raw"

import { Module, Environment } from "../logic.ts";

export default class Terminal extends TabBase {

	private inputConsole: HTMLTextAreaElement;
	private outputLog: HTMLTextAreaElement;

	private afterConsoleInput() {
		let input = this.inputConsole;
		input.value = input.value.replaceAll("\n", "");
		input.style.height = "";
		let computed = getComputedStyle(input);
		let borders = parseFloat(computed.borderTopWidth) + parseFloat(computed.borderBottomWidth);
		input.style.height = input.scrollHeight + borders + "px";
	}

	private consoleEnter() {
		let input = this.inputConsole;
		Module.LoadAndExecute(Environment, input.value);
		input.value = "";
	}

	public setupOutputLog() {
		this.outputLog.value = "";
		Module._PrintGreeting(Environment);
	}

	constructor() {
		let node = document.createElement("div");
		node.innerHTML = htmlSrc;

		super({node: node});

		this.title.label = "CLIPS Terminal";
		this.title.closable = false;

		this.outputLog = node.querySelector("#outputLog") as HTMLTextAreaElement;
		this.inputConsole = node.querySelector("#inputConsole") as HTMLTextAreaElement;

		this.inputConsole.addEventListener("keydown", (e : KeyboardEvent) => {
			if (e.key === "Enter") {
				e.preventDefault();
				if (!e.shiftKey) { this.consoleEnter(); }
			}
			this.afterConsoleInput();
		});

		this.inputConsole.addEventListener("input", (_ : any) => {
			this.afterConsoleInput();
		});

	}
}

