# stream simulation with ffmpeg

```
ffmpeg -re -i input.mp3 -acodec pcm_s16be -ar 44100 -ac 1 -f rtp rtp://localhost:5004
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