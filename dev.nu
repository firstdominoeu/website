def main [] {
	help main
}

def "main load" [] {
	nix build .#docker --no-link --print-out-paths | open | docker load
}

def "main run" [--detached (-d)] {
	if $detached {
		docker run -d -p 8080:8080 --name domino-app main:latest
	} else {
		docker run -p 8080:8080 --name domino-app main:latest
	}
}

def "main stop" [] {
	try { docker stop domino-app } catch { }
	try { docker rm domino-app } catch { }
}
