import makeModule from "./clips.js"
import type { MainModule } from "./emcc-tsd";
import TabBase from "./tabs/TabBase.ts";

export const CLIPSWatchItems = [
	"Activations", "Compilations", "Deffunctions",
	"Facts", "Focus", "Generic Functions", "Globals",
	"Instances", "Message Handlers", "Messages",
	"Methods", "Rules", "Slots", "Statistics"
];

var outputLog: HTMLTextAreaElement;

function output(text: string) {
	if (!outputLog) {
		outputLog = document.getElementById("outputLog") as HTMLTextAreaElement;
	}

	if (outputLog) {
		outputLog.value = outputLog.value + text + "\n";
		outputLog.scrollTop = outputLog.scrollHeight;
	} else  {
		console.log(text);
	}
}

function removeLastPrintedChar() {
	if (!outputLog) {
		outputLog = document.getElementById("outputLog") as HTMLTextAreaElement;
	}
	if (outputLog) {
		outputLog.value = outputLog.value.slice(0, -1);
	}
}

// Wrap or compose some Module functions that require extra processing, have side effects, or take string arguments. Other Module functions are called directly.
// TODO refactor this file and consider stuffing everything into one ClipsSession object
interface ExtendedModule extends MainModule {
	RecreateEnvironment(): void;
	LoadAndExecute(env: number, str: string): void;
	GetModuleAgenda(env: number, str: string): number;
	GetModuleFacts(env: number, str: string): number;
	SetWatchFlag(env: number, str: string, b: boolean): void;
	GetWatchFlag(env: number, str: string): boolean;
};

let Module = await makeModule({
	"print": output,
	"printErr": output,
	"removeLastPrintedChar": removeLastPrintedChar,
	"onRuntimeInitialized": () => { document.getElementById("loading-screen")?.remove(); }
}) as ExtendedModule;
let Environment = Module._CreateEnvironment();

// Keeps only the user's watch states for convenience
Module.RecreateEnvironment = () => {
	let watchStates: boolean[] = [];
	CLIPSWatchItems.forEach((str: string) => {
		let enumName = str.toUpperCase().replace(" ", "_");
		watchStates.push(Module.GetWatchFlag(Environment, enumName));
	});

	Module._DestroyEnvironment(Environment);
	Environment = Module._CreateEnvironment();

	for (let i = 0; i < CLIPSWatchItems.length; i++) {
		const str = CLIPSWatchItems[i];
		let enumName = str.toUpperCase().replace(" ", "_");
		Module.SetWatchFlag(Environment, enumName, watchStates[i]);
	}
};
Module.LoadAndExecute = (env: number, str: string) => {
	Module.ccall("LoadAndExecute", "void", ["number", "string"], [env, str]);
	TabBase.updateBrowsers();
};
Module.GetModuleAgenda = Module.cwrap("GetModuleAgenda", "number", ["number", "string"]);
Module.GetModuleFacts = Module.cwrap("GetModuleFacts", "number", ["number", "string"]);
Module.SetWatchFlag = Module.cwrap("SetWatchFlag", "void", ["number", "string", "boolean"]);
Module.GetWatchFlag = Module.cwrap("GetWatchFlag", "boolean", ["number", "string"]);

export { Module, Environment };
