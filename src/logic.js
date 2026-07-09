import makeModule from "./clips.js"
import clipsExample from "./example.clp?raw"

const Module = await makeModule();

const batchInput = document.getElementById("batchInput");
const clearOnSend = document.getElementById("clearOnSend");
const sendButton = document.getElementById("sendButton");

const inputConsole = document.getElementById("inputConsole");

var environment = undefined;

function consoleInput(obj) {
    obj.value = obj.value.replaceAll("\n", "");
    obj.style.height = "";
    obj.style.height = obj.scrollHeight + 4 + "px";
}

function consoleEnter() {
    Module.ccall("LoadAndExecute", null, ["number", "string"], [environment, inputConsole.value]);
    inputConsole.value = "";
}

function setupOutputLog() {
    outputLog.value = "";
    Module.ccall("PrintGreeting", null, ["number"], [environment]);
}

inputConsole.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
	e.preventDefault();
	if (!e.shiftKey) {
	    consoleEnter();
	}
    }
    consoleInput(inputConsole);
});

inputConsole.addEventListener("input", (e) => {
    consoleInput(e.target);
});

sendButton.addEventListener("click", function(e) {
    if (clearOnSend.checked) {
	Module.ccall("DestroyEnvironment", "boolean", ["number"], [environment]);
	environment = Module.ccall("CreateEnvironment", "number");
	setupOutputLog();
    }
    Module.ccall("LoadAndExecute", null, ["number", "string"], [environment, batchInput.value]);
});

enterButton.addEventListener("click", function(e) { consoleEnter(); });

environment = Module.ccall("CreateEnvironment", "number");
setupOutputLog();

if (batchInput.value === "") {
    batchInput.value = clipsExample;
}
