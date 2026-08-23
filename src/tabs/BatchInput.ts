import TabBase from "./TabBase.ts";
import htmlSrc from "./BatchInput.html?raw"

import { Module, Environment } from "../logic.ts";
import Terminal from "./Terminal.ts"

export default class BatchInput extends TabBase {

	private batchInput: HTMLTextAreaElement;

	constructor() {
		let node = document.createElement("div");
		node.innerHTML = htmlSrc;

		super({node: node});

		this.title.label = "Batch Input";

		let sendButton = node.querySelector("#sendButton") as HTMLButtonElement;
		let batchInput = node.querySelector("#batchInput") as HTMLTextAreaElement;
		let clearOnSend = node.querySelector("#clearOnSend") as HTMLInputElement;

		this.batchInput = batchInput;

		sendButton.addEventListener("click", function(_) {
			if (clearOnSend.checked) {
				Module.RecreateEnvironment();
				TabBase.getInstance(Terminal).setupOutputLog();
			}
			Module.LoadAndExecute(Environment, batchInput.value);
		});
	}

	public setBatchInput(str: string) {
		this.batchInput.value = str;
	}
}

