import { CommandRegistry } from "@lumino/commands";
import { MessageLoop } from "@lumino/messaging";
import { BoxPanel, DockPanel, Menu, MenuBar, Widget } from "@lumino/widgets";

import AgendaViewer from "./tabs/AgendaViewer.ts";
import BatchInput from "./tabs/BatchInput.ts"
import FactBrowser from "./tabs/FactBrowser.ts";
import Terminal from "./tabs/Terminal.ts"
import TabBase from "./tabs/TabBase.ts";

import exampleCollatz from "./examples/collatz.clp?raw"
import exampleSorting from "./examples/sort.clp?raw"
import { CLIPSWatchItems, Environment, Module } from "./logic.ts";

// commands & menubar menus

const commands = new CommandRegistry();

let themeMenu = new Menu({ commands });
themeMenu.title.label = "Theme";
let tabMenu = new Menu({ commands });
tabMenu.title.label = "Tabs";
let watchMenu = new Menu({ commands });
watchMenu.title.label = "Watch";
let exampleMenu = new Menu({ commands });
exampleMenu.title.label = "Examples";
let helpMenu = new Menu({ commands });
helpMenu.title.label = "Help";

// theme menu

const bodyClasses = document.body.classList;
commands.addCommand("theme:light", {
	label: "Light",
	execute: () => { bodyClasses.remove("dark"); },
});
themeMenu.addItem({ command: "theme:light" });

commands.addCommand("theme:dark", {
	label: "Dark",
	execute: () => { bodyClasses.add("dark"); },
});
themeMenu.addItem({ command: "theme:dark" });

// tabs & tab menu

let term = new Terminal();
let batch = new BatchInput();
let agenda = new AgendaViewer();
let facts = new FactBrowser();

const tabs: Array<TabBase> = [
	term,
	batch,
	agenda,
	facts
];

tabs.forEach((tab: TabBase) => {
	let canBeAdded = tab.title.closable;
	if (!canBeAdded) { return; }
	let tabName = tab.title.label;
	let commandId = "tab:" + tabName.toLowerCase().replace(" ", "-");
	commands.addCommand(commandId, {
		label: tabName,
		execute: () => {
			if (!tab.isAttached) {
				dock.addWidget(tab);
			}
		}
	});
	tabMenu.addItem({ command: commandId });
});

// watch menu

CLIPSWatchItems.forEach((str: string) => {
	let commandId = "watch:" + str.toLowerCase().replace(" ", "-");
	let enumName = str.toUpperCase().replace(" ", "_");
	let setter = () => { Module.SetWatchFlag(Environment, enumName, !getter()); }
	let getter = () => { return Module.GetWatchFlag(Environment, enumName); }
	commands.addCommand(commandId, {
		label: str,
		execute: setter,
		isToggled: getter
	});
	watchMenu.addItem({ command: commandId });
});

watchMenu.addItem({ type: 'separator' });

commands.addCommand("watch:all", {
	label: "All", execute: () => { Module.SetWatchFlag(Environment, "ALL", true); }
});
watchMenu.addItem({ command: "watch:all" });

commands.addCommand("watch:none", {
	label: "None", execute: () => { Module.SetWatchFlag(Environment, "ALL", false); }
});
watchMenu.addItem({ command: "watch:none" });

// examples menu

([
	[ "Collatz", exampleCollatz ],
	[ "Sorting", exampleSorting ]
] as [string, string][]).forEach(([name, str]: [string, string]) => {
	let commandId = "example:" + name.toLowerCase().replace(" ", "-");
	commands.addCommand(commandId, {
		label: name,
		execute: () => {
			if (!batch.isAttached) {
				// TODO make this a bit smarter
				dock.addWidget(batch, { ref: term });
			}
			batch.setBatchInput(str.trim());
		}
	});
	exampleMenu.addItem({ command: commandId });
});

// help menu

commands.addCommand("help:clipspage", {
	label: "CLIPS homepage",
	execute: () => { window.open("https://clipsrules.net/"); }
});
helpMenu.addItem({ command: "help:clipspage" });

commands.addCommand("help:source", {
	label: "View source code",
	execute: () => { window.open("https://github.com/DeathFuel/clips-web-ide/"); }
});
helpMenu.addItem({ command: "help:source" });

// widgets

let bar = new MenuBar();
bar.addMenu(themeMenu);
bar.addMenu(tabMenu);
bar.addMenu(watchMenu);
bar.addMenu(exampleMenu);
bar.addMenu(helpMenu);
bar.id = "menuBar";

let dock = new DockPanel();
dock.addWidget(term);
dock.addWidget(batch, { mode: "split-left", ref: term });
dock.addWidget(agenda, { mode: "split-bottom", ref: batch });
dock.addWidget(facts, { mode: "split-bottom", ref: term });
dock.id = "dock";

let main = new BoxPanel({ direction: "left-to-right", spacing: 0 });
main.id = "main";
main.addWidget(dock);

window.addEventListener("resize", () => {
	MessageLoop.postMessage(bar, new Widget.ResizeMessage(-1, -1));
	main.update();
});

Widget.attach(bar, document.body);
Widget.attach(main, document.body);

term.setupOutputLog();
TabBase.updateBrowsers();
