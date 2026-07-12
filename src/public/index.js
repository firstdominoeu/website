Promise.all(
	[
		"footer",
		"footer-icon",
		"navigation",
		"navigation-button",
		"page",
		"spin-star-loader"
	].map(x => customElements.whenDefined(x))
)
.then(() => document.body.classList.add("loaded"))
.catch(error => {
	console.error("failed to load custom elements:", error);

	document.body.classList.add("loaded");
});
