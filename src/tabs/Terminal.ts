import TabBase from "./TabBase.ts";
import htmlSrc from "./Terminal.html?raw"

import { Module, Environment } from "../logic.ts";

export default class Terminal extends TabBase {

	private inputConsole: HTMLTextAreaElement;
	private outputLog: HTMLTextAreaElement;

	// the zeroth element is reserved for keeping track of the inputConsole's value when browsing the history
	private consoleHistory: Array<string> = [""];
	private consoleHistoryPosition: number = 0;
	private readonly MaxHistorySize = 1024;

	private afterConsoleInput() {
		const input = this.inputConsole;
		input.value = input.value.replaceAll("\n", "");
		input.style.height = "";
		const computed = getComputedStyle(input);
		const borders = parseFloat(computed.borderTopWidth) + parseFloat(computed.borderBottomWidth);
		input.style.height = input.scrollHeight + borders + "px";
	}

	private consoleEnter() {
		Module.LoadAndExecute(Environment, this.inputConsole.value);
		this.consoleHistory[0] = this.inputConsole.value;
		this.consoleHistory.unshift("");
		this.consoleHistory = this.consoleHistory.slice(0, this.MaxHistorySize);
		this.consoleHistoryPosition = 0;
		this.inputConsole.value = "";
	}

	public setupOutputLog() {
		this.outputLog.value = "";
		Module._PrintGreeting(Environment);
	}

	constructor() {
		const node = document.createElement("div");
		node.innerHTML = htmlSrc;

		super({node: node});

		this.title.label = "CLIPS Terminal";
		this.title.closable = false;

		this.outputLog = node.querySelector("#outputLog") as HTMLTextAreaElement;
		this.inputConsole = node.querySelector("#inputConsole") as HTMLTextAreaElement;

		this.inputConsole.addEventListener("keydown", (e : KeyboardEvent) => {
			if (e.key === "Enter") {
				e.preventDefault();
				if (!e.shiftKey) {
					this.consoleEnter();
					this.afterConsoleInput();
				}
			}
			if (e.key !== "ArrowUp" && e.key !== "ArrowDown") {
				return;
			}
			e.preventDefault();

			if (e.key === "ArrowUp") {
				if (this.consoleHistoryPosition == 0) {
					this.consoleHistory[this.consoleHistoryPosition] = this.inputConsole.value;
				}
				this.consoleHistoryPosition = Math.min(
					this.consoleHistory.length - 1,
					this.consoleHistoryPosition + 1
				);
			} else { // "ArrowDown"
				this.consoleHistoryPosition = Math.max(
					0,
					this.consoleHistoryPosition - 1
				);
			}
			this.inputConsole.value = this.consoleHistory[this.consoleHistoryPosition];
			this.afterConsoleInput();
		});

		this.inputConsole.addEventListener("input", (_ : any) => {
			this.afterConsoleInput();
		});
	}

	protected override getHardcodedClassName(): string {
		return "Terminal";
	}
}

