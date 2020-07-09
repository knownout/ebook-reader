import "normalize.css";
import "./root.less";

window.addEventListener("load", async () => {
	const dialog = document.createElement("input");
	dialog.type = "file";

	dialog.onchange = async () => {};
	window.onclick = () => dialog.click();
});
