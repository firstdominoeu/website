import * as Path from "path";
import * as Process from "process";

Bun.serve({
	port: 8080,

	fetch: async request => {
		let url: URL = new URL(request.url);
		let urlPathName: string = url.pathname;
		
		if (urlPathName === "/") {
			urlPathName = "/index.html";
		}
		
		let currentWorkingDirectory: string = Process.cwd();
		let path: string = Path.join(currentWorkingDirectory, "src", "public", urlPathName);
		
		let file: Bun.BunFile = Bun.file(path);
		let fileExists: boolean = await file.exists();
		
		if (!fileExists) {
			if (!urlPathName.endsWith("/") && !Path.extname(urlPathName)) {
				let htmlExtension: string = ".html";
				let htmlFallbackPath: string = path + htmlExtension;
				let htmlFile: Bun.BunFile = Bun.file(htmlFallbackPath);
				
				if (await htmlFile.exists()) {
					file = htmlFile;
					fileExists = true;
				}
			}
		}
		
		if (fileExists) {
			return new Response(file);
		}

		return new Response("not found", {
			status: 404
		});
	}
});
