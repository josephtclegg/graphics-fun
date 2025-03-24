We're using node with express to serve static HTML pages :3 but it is dockerized!

To build the image, run:
`docker build -t freegoats .`

*Hint: don't forget to start docker-desktop ;)

Then to build the container (assuming ssl keys are in the directory ./ssl):
`docker run --mount type=bind,src=./ssl,dst=/home/node/app/keys --name freegoats -p 443:3000 -p 80:8080 -d freegoats`

Then on subsequent starts you can just do:
`docker start freegoats`

Note that when you run the container, you have to supply the location of your server's SSL certificate .crt
file, which MUST be named server.crt, and your private key, which MUST be named server.key (unless you change
the name in index.js first)

You don't have to build the image or the container again.

Note the port mappings: the HTTPS server is on 3000 natively, the HTTP server is on 8080


                             ///                        ///
                            /  /                       // /
                           /   /                      //| /
                          /     /____________________// | /
                         /                                /
                        /                                 /
                        |                                 /
                        |                                 /
                        |                                 /
                        |       0           0             /
                        \            I                    /
                         \           -                  /
                          \                            /
                             \                    /
                                  \  ------   /
                                
