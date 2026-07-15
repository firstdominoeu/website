import { EUROPE_MAP_PATHS } from "../constant/europe-map.js";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const NUMBER_FORMAT = new Intl.NumberFormat("en-GB");
const VISUAL_SEATS = 180;

const PARLIAMENT_GROUPS = [
	["socialist", "Socialists", "#dc2626", "Social rights, public services and a continental floor for dignity."],
	["green", "Greens", "#16a34a", "Climate action, sustainability and a stronger voice for Europe’s regions."],
	["social_democrat", "Social Democrats", "#70003d", "Dynamic markets balanced by strong public services and shared prosperity."],
	["federalist", "Non-aligned Federalists", "#9ca3af", "The movement’s common federal foundation, without alignment to a political wing."],
	["liberal", "Liberals", "#ca8a04", "Civil liberties, the rule of law and a fully connected European single market."],
	["conservative", "Conservatives", "#2563eb", "Continental security and defence while preserving national heritage."]
].map(([key, label, colour, description]) => ({ key, label, colour, description }));

function svg(tagName, attributes = {}) {
	const element = document.createElementNS(SVG_NAMESPACE, tagName);
	for (const [name, value] of Object.entries(attributes)) {
		element.setAttribute(name, String(value));
	}
	return element;
}

async function fetchJson(path) {
	const response = await fetch(path);
	if (!response.ok) {
		throw new Error(`Could not load ${path}: ${response.status}`);
	}
	return response.json();
}

function countOf(record) {
	const count = Number(record?.count);
	return Number.isFinite(count) ? count : 0;
}

function percentage(count, total) {
	return total > 0 ? `${((count / total) * 100).toFixed(1)}%` : "0%";
}

function memberColour(count, maximum) {
	if (count <= 0 || maximum <= 0) {
		return "#e5e5e2";
	}

	const amount = Math.sqrt(count / maximum);
	const start = [210, 218, 239];
	const end = [45, 67, 153];
	const channel = index => Math.round(start[index] + (end[index] - start[index]) * amount);
	return `rgb(${channel(0)}, ${channel(1)}, ${channel(2)})`;
}

function setStatus(container, message) {
	if (!container) {
		return;
	}
	const status = document.createElement("p");
	status.className = "visual-status";
	status.textContent = message;
	container.replaceChildren(status);
}

function renderMap(countryData) {
	const map = document.querySelector("#europe-map");
	const layer = document.querySelector("#europe-map-countries");
	const canvas = document.querySelector(".map-canvas");
	const tooltip = document.querySelector("#map-tooltip");

	if (!map || !layer || !canvas || !tooltip) {
		return;
	}

	const countries = EUROPE_MAP_PATHS.map(country => ({
		...country,
		count: countOf(countryData[country.key])
	}));
	const total = countries.reduce((sum, country) => sum + country.count, 0);
	const maximum = Math.max(0, ...countries.map(country => country.count));

	let activePath = null;

	function positionTooltip(clientX, clientY) {
		const canvasBox = canvas.getBoundingClientRect();
		const tooltipBox = tooltip.getBoundingClientRect();
		const gap = 14;
		const x = Math.min(
			Math.max(clientX - canvasBox.left + gap, gap),
			Math.max(gap, canvasBox.width - tooltipBox.width - gap)
		);
		const y = Math.min(
			Math.max(clientY - canvasBox.top + gap, gap),
			Math.max(gap, canvasBox.height - tooltipBox.height - gap)
		);
		tooltip.style.left = `${x}px`;
		tooltip.style.top = `${y}px`;
	}

	function showCountry(path, country, clientX, clientY) {
		activePath?.classList.remove("is-active");
		activePath = path;
		path.classList.add("is-active");

		const name = document.createElement("strong");
		name.textContent = country.label;
		const value = document.createElement("span");
		value.textContent = country.count > 0
			? `${NUMBER_FORMAT.format(country.count)} members · ${percentage(country.count, total)}`
			: "No members recorded";
		tooltip.replaceChildren(name, value);
		tooltip.hidden = false;

		if (Number.isFinite(clientX) && Number.isFinite(clientY)) {
			positionTooltip(clientX, clientY);
		} else {
			const box = path.getBoundingClientRect();
			positionTooltip(box.left + box.width / 2, box.top + box.height / 2);
		}
	}

	function hideCountry(path) {
		if (document.activeElement === path) {
			return;
		}
		path.classList.remove("is-active");
		if (activePath === path) {
			activePath = null;
			tooltip.hidden = true;
		}
	}

	const fragment = document.createDocumentFragment();
	for (const country of countries) {
		const label = country.count > 0
			? `${country.label}: ${NUMBER_FORMAT.format(country.count)} members, ${percentage(country.count, total)}`
			: `${country.label}: no members recorded`;
		const path = svg("path", {
			d: country.path,
			class: "map-country",
			fill: memberColour(country.count, maximum),
			"data-country": country.key,
			"fill-rule": "evenodd",
			"vector-effect": "non-scaling-stroke",
			tabindex: 0,
			role: "button",
			"aria-label": label
		});
		const title = svg("title");
		title.textContent = label;
		path.append(title);
		path.addEventListener("pointerenter", event => showCountry(path, country, event.clientX, event.clientY));
		path.addEventListener("pointermove", event => positionTooltip(event.clientX, event.clientY));
		path.addEventListener("pointerleave", () => hideCountry(path));
		path.addEventListener("focus", () => showCountry(path, country));
		path.addEventListener("blur", () => hideCountry(path));
		path.addEventListener("click", event => {
			event.stopPropagation();
			path.focus({ preventScroll: true });
			showCountry(path, country, event.clientX, event.clientY);
		});
		fragment.append(path);
	}
	layer.replaceChildren(fragment);
}

function allocateSeats(groups) {
	const total = groups.reduce((sum, group) => sum + group.count, 0);
	const allocations = groups.map((group, index) => {
		const exact = total > 0 ? group.count / total * VISUAL_SEATS : 0;
		return { key: group.key, index, seats: Math.floor(exact), remainder: exact % 1 };
	});
	let remaining = VISUAL_SEATS - allocations.reduce((sum, item) => sum + item.seats, 0);

	for (const item of [...allocations].sort((a, b) => b.remainder - a.remainder || a.index - b.index)) {
		if (remaining-- <= 0) {
			break;
		}
		item.seats += 1;
	}
	return Object.fromEntries(allocations.map(item => [item.key, item.seats]));
}

function polar(centreX, centreY, radius, angle) {
	return {
		x: centreX + radius * Math.cos(angle),
		y: centreY - radius * Math.sin(angle)
	};
}

function wedgePath(centreX, centreY, innerRadius, outerRadius, startAngle, endAngle) {
	const outerStart = polar(centreX, centreY, outerRadius, startAngle);
	const outerEnd = polar(centreX, centreY, outerRadius, endAngle);
	const innerStart = polar(centreX, centreY, innerRadius, endAngle);
	const innerEnd = polar(centreX, centreY, innerRadius, startAngle);
	return [
		`M ${outerStart.x} ${outerStart.y}`,
		`A ${outerRadius} ${outerRadius} 0 0 1 ${outerEnd.x} ${outerEnd.y}`,
		`L ${innerStart.x} ${innerStart.y}`,
		`A ${innerRadius} ${innerRadius} 0 0 0 ${innerEnd.x} ${innerEnd.y}`,
		"Z"
	].join(" ");
}

function hemicycle() {
	const rowCounts = [20, 24, 28, 32, 36, 40];
	const centreX = 450;
	const centreY = 455;
	const innerRadius = 150;
	const outerRadius = 390;
	const radiusStep = (outerRadius - innerRadius) / (rowCounts.length - 1);
	const positions = [];

	rowCounts.forEach((seatCount, rowIndex) => {
		const radius = innerRadius + radiusStep * rowIndex;
		for (let seatIndex = 0; seatIndex < seatCount; seatIndex += 1) {
			const angle = Math.PI - (seatIndex + 0.5) / seatCount * Math.PI;
			positions.push({ angle, radius, ...polar(centreX, centreY, radius, angle) });
		}
	});
	positions.sort((a, b) => b.angle - a.angle || a.radius - b.radius);
	return { rowCounts, centreX, centreY, innerRadius, outerRadius, radiusStep, positions };
}

function renderParliament(ideologyData) {
	const chart = document.querySelector("#parliament-chart");
	const details = document.querySelector("#parliament-details");
	if (!chart || !details) {
		return;
	}

	const groups = PARLIAMENT_GROUPS.map(group => ({ ...group, count: countOf(ideologyData[group.key]) }));
	const groupByKey = new Map(groups.map(group => [group.key, group]));
	const total = groups.reduce((sum, group) => sum + group.count, 0);
	const seats = allocateSeats(groups);
	const layout = hemicycle();
	const seatKeys = groups.flatMap(group => Array(seats[group.key]).fill(group.key));
	const groupElements = new Map();
	let lockedGroup = null;

	chart.replaceChildren();

	layout.rowCounts.forEach((_, rowIndex) => {
		const radius = layout.innerRadius + layout.radiusStep * rowIndex;
		chart.append(svg("path", {
			d: `M ${layout.centreX - radius} ${layout.centreY} A ${radius} ${radius} 0 0 1 ${layout.centreX + radius} ${layout.centreY}`,
			class: "parliament-arc"
		}));
	});
	chart.append(
		svg("line", { x1: 36, y1: layout.centreY, x2: 864, y2: layout.centreY, class: "parliament-floor" }),
		svg("rect", { x: layout.centreX - 26, y: layout.centreY - 12, width: 52, height: 8, rx: 2, class: "parliament-podium" })
	);

	let angleCursor = Math.PI;
	for (const group of groups) {
		const groupAngle = total > 0 ? group.count / total * Math.PI : 0;
		const endAngle = angleCursor - groupAngle;
		const element = svg("g", {
			class: "parliament-group",
			"data-group": group.key,
			tabindex: 0,
			role: "button",
			"aria-label": `${group.label}: ${NUMBER_FORMAT.format(group.count)} members, ${percentage(group.count, total)}`
		});
		element.append(svg("path", {
			d: wedgePath(layout.centreX, layout.centreY, layout.innerRadius - 18, layout.outerRadius + 14, angleCursor, endAngle),
			class: "parliament-hit-area"
		}));
		const title = svg("title");
		title.textContent = `${group.label}: ${NUMBER_FORMAT.format(group.count)} members`;
		element.append(title);
		groupElements.set(group.key, element);
		chart.append(element);
		angleCursor = endAngle;
	}

	layout.positions.forEach((position, index) => {
		const key = seatKeys[index];
		const group = groupByKey.get(key);
		groupElements.get(key).append(svg("circle", {
			cx: position.x.toFixed(2),
			cy: position.y.toFixed(2),
			r: 5.8,
			fill: group.colour,
			class: "parliament-seat",
			"vector-effect": "non-scaling-stroke"
		}));
	});

	function updateDetails(key) {
		details.replaceChildren();
		const title = document.createElement("strong");
		const value = document.createElement("span");
		if (!key) {
			title.textContent = `${NUMBER_FORMAT.format(total)} members`;
			value.textContent = `${VISUAL_SEATS} visual seats, allocated proportionally from the ideology data.`;
			details.append(title, value);
			return;
		}
		const group = groupByKey.get(key);
		title.textContent = group.label;
		value.textContent = `${NUMBER_FORMAT.format(group.count)} members · ${percentage(group.count, total)} · ${seats[key]} visual seats`;
		const description = document.createElement("small");
		description.textContent = group.description;
		details.append(title, value, description);
	}

	function activate(key) {
		chart.classList.toggle("has-active-group", Boolean(key));
		for (const [groupKey, element] of groupElements) {
			element.classList.toggle("is-active", groupKey === key);
			element.setAttribute("aria-pressed", String(groupKey === lockedGroup));
		}
		updateDetails(key);
	}

	function wire(element, key) {
		element.addEventListener("pointerenter", () => activate(key));
		element.addEventListener("pointerleave", () => activate(lockedGroup));
		element.addEventListener("focus", () => activate(key));
		element.addEventListener("blur", () => activate(lockedGroup));
		element.addEventListener("click", () => {
			lockedGroup = lockedGroup === key ? null : key;
			activate(lockedGroup);
		});
	}

	for (const group of groups) {
		wire(groupElements.get(group.key), group.key);
	}
	updateDetails(null);
}

async function initialise() {
	try {
		const [countryData, ideologyData] = await Promise.all([
			fetchJson("/constant/country.json"),
			fetchJson("/constant/ideology.json")
		]);
		renderMap(countryData);
		renderParliament(ideologyData);
	} catch (error) {
		console.error("Could not initialise data visualisations:", error);
		setStatus(document.querySelector("#where-we-are .visual-section__inner"), "The member map could not be loaded.");
		setStatus(document.querySelector("#parliament .visual-section__inner"), "The parliament could not be loaded.");
	}
}

initialise();
