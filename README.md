# stream simulation with ffmpeg

```
ffmpeg -re -i input.mp3 -acodec pcm_s16be -ar 44100 -ac 1 -f rtp rtp://localhost:5004
```

```
ffmpeg -re -i input.mp3 -acodec pcm_mulaw -ar 24000 -ac 1 -f rtp rtp://127.0.0.1:5005
```

# Before runing set default google AOD path

- linux

```
export GOOGLE_APPLICATION_CREDENTIALS="absolutt path"
```

- windows

```
set GOOGLE_APPLICATION_CREDENTIALS=relative_path
```
