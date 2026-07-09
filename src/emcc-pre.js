const outputLog = document.getElementById("outputLog");

function output(text) {
    outputLog.value = outputLog.value + text + "\n";
    outputLog.scrollTop = outputLog.scrollHeight;
}

var Module = {
    "print": output,
    "printErr": output,
};
