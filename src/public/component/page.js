class Page extends HTMLElement {
	constructor() {
		super();

		this.attachShadow({
			mode: "open"
		});
		this.shadowRoot.innerHTML = `
			<style>
				:host {
					display: flex;
					flex-direction: column;
					justify-content: start;
					align-items: center;
					overflow-x: hidden;
					overflow-y: scroll;
				}
			</style>
			<slot></slot>
		`;
	}
}

customElements.define('page', Page);
