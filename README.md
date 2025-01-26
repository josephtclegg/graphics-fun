We're using node with express to serve static HTML pages :3 but it is dockerized!

To build the image, run:
`docker build -t IMAGE_NAME .`

*Hint: don't forget to start docker-desktop ;)

Then to build the container:
`docker run --mount type=bind,src=./PATH/TO/SSL/KEYS,dst=/home/node/app/keys --name CONTAINER_NAME -p 443:3000 -p 80:8080 -d IMAGE_NAME`

Then on subsequent starts you can just do:
`docker start CONTAINER_NAME`

Note that when you run the container, you have to supply the location of your server's SSL certificate .crt
file, which MUST be named server.crt, and your private key, which MUST be named server.key

You don't have to build the image or the container again.

Note that we mapped port 8080 on the host to 3000 on the conatainer.  I have Express
setup to use port 3000, so we have to map whatever port we want to use on the host to
that, but otherwise I chose 8080 arbitrarily.


                             ///                        ///
                            /  /                       /  /
                           /   /                      /   /
                          /     /____________________/    /
                         /                                /
                        /                                 /
                        |                                 /
                        |                                 /
                        |                                 /
                        |       0           0             /
                        \            I                    /
                         \                               /
                          \                            /
                             \                    /
                                  \  ------   /
                                
