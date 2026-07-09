import Split from "split.js";

Split(["#split-left", "#split-right"], {
    snapOffset: 0,
    gutterSize: 9,
    minSize: 400,
})

const tabs = document.querySelectorAll(".tab");
const contents = document.querySelectorAll(".tab-content");
const tabBar = document.getElementById("tabBar");

tabs.forEach(tab => {
    tab.addEventListener("click", () => {
	const content = document.getElementById(tab.dataset.target)

	tabs.forEach(t => t.classList.remove("active"));
	tab.classList.add("active");

	contents.forEach(c => c.classList.remove("active"));
	content.classList.add("active");
    });
});
