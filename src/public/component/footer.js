class Footer extends HTMLElement {
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
					margin-top: auto;
					padding-bottom: 1.5rem;
				}
			</style>
			<slot></slot>
		`;
	}
	

}

customElements.define("footer", Footer);
