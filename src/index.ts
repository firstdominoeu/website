import html from "./index.html";

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
			
			case "/another-path": break
		}
		
		return new Response("not found", {
			status: 404
		});
	}
});