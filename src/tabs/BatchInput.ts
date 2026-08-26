import {
	EditorState
} from "@codemirror/state"
import {
	EditorView,
	keymap,
	highlightSpecialChars,
	highlightActiveLine,
	lineNumbers,
	highlightActiveLineGutter
} from "@codemirror/view"
import {
	indentOnInput,
	bracketMatching,
	indentUnit
} from "@codemirror/language"
import {
	defaultKeymap,
	history,
	historyKeymap,
    insertTab,
} from "@codemirror/commands"
import {
	highlightSelectionMatches
} from "@codemirror/search"
import {
	closeBrackets,
	closeBracketsKeymap
} from "@codemirror/autocomplete"

import TabBase from "./TabBase.ts";
import htmlSrc from "./BatchInput.html?raw"

import { Module, Environment } from "../logic.ts";
import Terminal from "./Terminal.ts"

export default class BatchInput extends TabBase {

	private view: EditorView;

	constructor() {
		let node = document.createElement("div");
		node.innerHTML = htmlSrc;

		super({node: node});

		this.title.label = "Batch Input";

		let sendButton = node.querySelector("#sendButton") as HTMLButtonElement;
		let clearOnSend = node.querySelector("#clearOnSend") as HTMLInputElement;

		const send = (str: string) => {
			if (clearOnSend.checked) {
				Module.RecreateEnvironment();
				TabBase.getInstance(Terminal).setupOutputLog();
			}
			Module.LoadAndExecute(Environment, str);
		}

		sendButton.addEventListener("click", function(_) {
			send(view.state.doc.toString())
		});

		let view = new EditorView({
			extensions: [
				lineNumbers(),
				highlightSpecialChars(),
				history(),
				indentOnInput(),
				indentUnit.of("    "),
				EditorState.tabSize.of(4),
				bracketMatching(),
				closeBrackets(),
				highlightActiveLine(),
				highlightActiveLineGutter(),
				highlightSelectionMatches(),
				keymap.of([
					{
						key: "Control-Shift-Enter",
						run(target: EditorView) {
							send(target.state.doc.toString());
							return true;
						}
					},
					{
						key: "Tab",
						run: insertTab
					},
					...closeBracketsKeymap,
					...defaultKeymap,
					...historyKeymap
				]),
			],
		});
		this.view = view;
		node.insertBefore(view.dom, node.firstChild);
	}

	public setBatchInput(str: string) {
		this.view.dispatch({
			changes: { from: 0, to: this.view.state.doc.length, insert: str }
		});
	}
}

