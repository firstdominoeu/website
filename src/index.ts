import express from "express";

function main() {
	let server: express.Express = express();
	
	server.get("/", (request, response) => {
		// serve website ... 
		
	});
	
	server.get("/...", (request, response) => {
		
	});
}

main();