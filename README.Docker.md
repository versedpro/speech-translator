## Docker build and run the application

### How to build?

```sh
docker compose build
```

### How to run?

```sh
docker run --env-file .env --volume <absolute_path_to_your_google_credential_file>:/usr/src/app/google-credential.json -p 4001:4001 -p 5004:5004/udp -p 5006:5006/udp barix-translator
```

- param1 (.env): envinronment values
- param2 (google credential file path): left side is the path of google credential file in your host machine, while right side is the path of credential file in the container and it shouldn't be changed.
- param3: listner's port
- param4: input stream port, in case of deepgram
- param5: input stream port, in case of google
- param6: docker image name

## Docker general guide

### Building and running your application

When you're ready, start your application by running:
`docker compose up --build`.

Your application will be available at http://localhost:4001.

### Deploying your application to the cloud

First, build your image, e.g.: `docker build -t myapp .`.
If your cloud uses a different CPU architecture than your development
machine (e.g., you are on a Mac M1 and your cloud provider is amd64),
you'll want to build the image for that platform, e.g.:
`docker build --platform=linux/amd64 -t myapp .`.

Then, push it to your registry, e.g. `docker push myregistry.com/myapp`.

Consult Docker's [getting started](https://docs.docker.com/go/get-started-sharing/)
docs for more detail on building and pushing.

### References

- [Docker's Node.js guide](https://docs.docker.com/language/nodejs/)
