We're using node with express to serve static HTML pages :3 but it is dockerized!

To build the image, run:
`docker build -t IMAGE_NAME .`

*Hint: don't forget to start docker-desktop ;)

Then to build the container:
`docker run --name CONTAINER_NAME -p 8080:3000 -d IMAGE_NAME`

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
                                
