import * as Path from "path";
import * as Process from "process";
import html from "./index.html";
import whyHtml from "./why.html";

Bun.serve({
	port: 8080,

	fetch: request => {
		let url: URL = new URL(request.url);

		switch (url.pathname) {
			case "/": return new Response(html as unknown as Bun.BodyInit, {
				headers: {
					"Content-Type": "text/html"
				}
			});
			case "/why": return new Response(whyHtml as unknown as Bun.BodyInit, {
				headers: {
					"Content-Type": "text/html"
				}
			});
		}

		if (url.pathname.startsWith("/asset/")) {
			let cwd: string = Process.cwd();
			let path: string = Path.join(cwd, "src", url.pathname);
			let file: Bun.BunFile = Bun.file(path);

			return new Response(file);
		}

		return new Response("not found", {
			status: 404
		});
	}
});
