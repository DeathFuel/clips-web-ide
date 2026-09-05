import { CommandRegistry } from "@lumino/commands";
import { MessageLoop } from "@lumino/messaging";
import { BoxPanel, DockLayout, DockPanel, Menu, MenuBar, Widget } from "@lumino/widgets";

import AgendaViewer from "./tabs/AgendaViewer.ts";
import BatchInput from "./tabs/BatchInput.ts"
import ConstructInspector from "./tabs/ConstructInspector.ts";
import FactBrowser from "./tabs/FactBrowser.ts";
import GlobalBrowser from "./tabs/GlobalBrowser.ts";
import InstanceBrowser from "./tabs/InstanceBrowser.ts";
import Terminal from "./tabs/Terminal.ts"
import TabBase from "./tabs/TabBase.ts";

import exampleCollatz from "./examples/collatz.clp?raw"
import exampleRCA from "./examples/rca.clp?raw"
import exampleReachability from "./examples/reachability.clp?raw"
import exampleSorting from "./examples/sort.clp?raw"
import { CLIPSWatchItems, Environment, Module } from "./logic.ts";

// commands & menubar menus

const commands = new CommandRegistry();

const themeMenu = new Menu({ commands });
themeMenu.title.label = "Theme";
const tabMenu = new Menu({ commands });
tabMenu.title.label = "Tabs";
const watchMenu = new Menu({ commands });
watchMenu.title.label = "Watch";
const exampleMenu = new Menu({ commands });
exampleMenu.title.label = "Examples";
const helpMenu = new Menu({ commands });
helpMenu.title.label = "Help";

// theme menu

const bodyClasses = document.body.classList;
commands.addCommand("theme:light", {
	label: "Light",
	execute: () => {
		bodyClasses.remove("dark");
		localStorage.setItem("theme", "light");
	},
});
themeMenu.addItem({ command: "theme:light" });

commands.addCommand("theme:dark", {
	label: "Dark",
	execute: () => {
		bodyClasses.add("dark");
		localStorage.setItem("theme", "dark");
	},
});
themeMenu.addItem({ command: "theme:dark" });

// tabs & tab menu

const term = new Terminal();
const batch = new BatchInput();

const tabs: Array<TabBase> = [
	term,
	batch,
	new AgendaViewer(),
	new FactBrowser(),
	new GlobalBrowser(),
	new InstanceBrowser(),
	new ConstructInspector(),
];

tabs.forEach((tab: TabBase) => {
	const canBeAdded = tab.title.closable;
	if (!canBeAdded) { return; }
	const tabName = tab.title.label;
	const commandId = "tab:" + tabName.toLowerCase().replaceAll(" ", "-");
	commands.addCommand(commandId, {
		label: tabName,
		execute: () => {
			if (tab.isAttached) {
				tab.close()
			} else {
				dock.addWidget(tab);
			}
		},
		isToggled: () => tab.isAttached
	});
	tabMenu.addItem({ command: commandId });
});

// watch menu

CLIPSWatchItems.forEach((str: string) => {
	const commandId = "watch:" + str.toLowerCase().replaceAll(" ", "-");
	const enumName = str.toUpperCase().replaceAll(" ", "_");
	const setter = () => { Module.SetWatchFlag(Environment, enumName, !getter()); }
	const getter = () => { return Module.GetWatchFlag(Environment, enumName); }
	commands.addCommand(commandId, {
		label: str,
		execute: setter,
		isToggled: getter
	});
	watchMenu.addItem({ command: commandId });
});

watchMenu.addItem({ type: "separator" });

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
	[ "Collatz conjecture", exampleCollatz ],
	[ "Graph reachability", exampleReachability ],
	[ "Ripple-carry adder", exampleRCA ],
	[ "Sorting w/ modules", exampleSorting ],
] as [string, string][]).forEach(([name, str]: [string, string]) => {
	const commandId = "example:" + name.toLowerCase().replaceAll(" ", "-");
	commands.addCommand(commandId, {
		label: name,
		execute: () => {
			if (!batch.isAttached) {
				dock.addWidget(batch, { ref: term });
			}
			dock.selectWidget(batch);
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

commands.addCommand("help:issue", {
	label: "Report an issue",
	execute: () => { window.open("https://github.com/DeathFuel/clips-web-ide/issues/"); }
});
helpMenu.addItem({ command: "help:issue" });

// widget layout serialization, deserialization, saving, defaults...

const defaultLayout = {
    "type": "split-area",
    "orientation": "horizontal",
    "sizes": [ 0.25, 0.375, 0.375 ],
    "children": [
        {
            "type": "split-area",
            "orientation": "vertical",
            "sizes": [ 0.2, 0.2, 0.2, 0.2, 0.2 ],
            "children": [
                { "type": "tab-area", "currentIndex": 0, "widgets": [ "AgendaViewer" ] },
                { "type": "tab-area", "currentIndex": 0, "widgets": [ "FactBrowser" ] },
                { "type": "tab-area", "currentIndex": 0, "widgets": [ "GlobalBrowser" ] },
                { "type": "tab-area", "currentIndex": 0, "widgets": [ "InstanceBrowser" ] },
                { "type": "tab-area", "currentIndex": 0, "widgets": [ "ConstructInspector" ] }
            ]
        },
        { "type": "tab-area", "currentIndex": 0, "widgets": [ "BatchInput" ] },
        { "type": "tab-area", "currentIndex": 0, "widgets": [ "Terminal" ] }
    ]
}

function mapLayoutIDs(area: DockLayout.AreaConfig | null): any {
	if (!area) return null;
	if (area.type === "tab-area") {
		return {
			type: "tab-area",
			currentIndex: area.currentIndex,
			widgets: area.widgets.map((w: Widget) => w.id)
		};
	}
	return {
		type: "split-area",
		orientation: area.orientation,
		sizes: area.sizes,
		children: area.children.map(mapLayoutIDs)
	};
}

const idToTab: Map<string, TabBase> = new Map();
tabs.forEach((t: TabBase) => { idToTab.set(t.id, t); });

function unmapLayoutIDs(area: any): DockLayout.AreaConfig | null {
	if (!area) return null;
	if (area.type === "tab-area") {
		return {
			type: "tab-area",
			currentIndex: area.currentIndex,
			widgets: area.widgets.map((id: string) => idToTab.get(id)).filter((e: any) => e !== undefined)
		};
	}
	return {
		type: "split-area",
		orientation: area.orientation,
		sizes: area.sizes,
		children: area.children ? area.children.map(unmapLayoutIDs) : []
	};
}

// main dockpanel, continued layout logic

const dock = new DockPanel();
dock.addWidget(term);
dock.id = "dock";

try {
	const savedLayout = localStorage.getItem("savedLayout");
	const parsedLayout = savedLayout ? JSON.parse(savedLayout) : null;
	if (parsedLayout) {
		dock.restoreLayout({ main: unmapLayoutIDs(parsedLayout) });
	} else {
		dock.restoreLayout({ main: unmapLayoutIDs(defaultLayout) });
	}
} catch (e: any) {
	console.error(e);
	dock.restoreLayout({ main: unmapLayoutIDs(defaultLayout) });
}

dock.layoutModified.connect(() => {
	localStorage.setItem(
		"savedLayout",
		JSON.stringify(mapLayoutIDs(dock.saveLayout().main))
	);
});

tabMenu.addItem({ type: "separator" });
commands.addCommand("tab:reset-layout", {
	label: "Reset layout",
	execute: () => {
		dock.restoreLayout({ main: unmapLayoutIDs(defaultLayout) });
	}
});
tabMenu.addItem({ command: "tab:reset-layout" });

// menubar and everything else

const bar = new MenuBar();
bar.addMenu(themeMenu);
bar.addMenu(tabMenu);
bar.addMenu(watchMenu);
bar.addMenu(exampleMenu);
bar.addMenu(helpMenu);
bar.id = "menuBar";

const main = new BoxPanel({ direction: "left-to-right", spacing: 0 });
main.id = "main";
main.addWidget(dock);

if (localStorage.getItem("theme") === "dark") {
	bodyClasses.add("dark");
}

window.addEventListener("resize", () => {
	MessageLoop.postMessage(bar, new Widget.ResizeMessage(-1, -1));
	main.update();
});

Widget.attach(bar, document.body);
Widget.attach(main, document.body);

term.setupOutputLog();
TabBase.updateBrowsers();
