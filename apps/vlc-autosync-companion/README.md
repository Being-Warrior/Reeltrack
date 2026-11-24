# ReelTrack VLC companion

This local Node companion polls VLC's password-protected HTTP interface and
sends only playback metadata to a paired ReelTrack account: a cleaned filename,
movie/show/episode fields where they can be identified safely, position,
duration, and time. It never uploads the file path, the media file, or the VLC
password. The device token is stored only in `~/.reeltrack-autosync/vlc.json`,
outside this project.

## One-time VLC setup

1. In VLC, open **Tools → Preferences** and select **All** settings.
2. Go to **Interface → Main interfaces → Lua** and set an HTTP password.
3. Under **Interface → Main interfaces**, enable **Web**. Keep the host local;
   do not expose VLC's HTTP service to the internet.
4. Restart VLC.

## Pair and start tracking

### Easy Windows launcher

Double-click **`ReelTrack VLC Companion.cmd`** in this folder, then:

1. Choose **Set up and pair this VLC computer** and paste the code from ReelTrack’s
   **AutoSync → Pair VLC** button.
   The launcher creates a random local password, backs up your VLC preferences,
   enables localhost-only VLC Web control, and asks you to restart VLC.
2. Choose **Start VLC tracking** whenever VLC is open. Keep the small companion
   window open while watching; no VLC password is requested.

The launcher needs Node.js installed because this is the current local beta
companion. A packaged tray application is the next distribution step; this
launcher avoids manually entering project commands until then.

## Keep tracking in the background

After pairing once, double-click **`Install Background Tracking.cmd`** and
approve its confirmation. It adds a per-user Windows sign-in task called
`ReelTrack VLC AutoSync`, which starts the companion hidden whenever you sign
in. The companion waits for VLC if VLC is closed and resumes when it becomes
available. It does not start VLC itself.

To stop this permanently, double-click **`Uninstall Background Tracking.cmd`**.
You can start it immediately without signing out by double-clicking
**`run-hidden.vbs`**.

### Command-line alternative

1. In ReelTrack’s **AutoSync** page, click **Pair VLC** and copy its code.
2. From the ReelTrack project directory, pair the companion:

```powershell
node apps/vlc-autosync-companion/index.mjs pair --code YOUR_CODE --name "My VLC"
```

3. Start tracking, replacing the password with the one configured in VLC:

```powershell
node apps/vlc-autosync-companion/index.mjs watch
```

VLC is assumed to listen on `http://127.0.0.1:8080`. To use another local port,
append `--vlc http://127.0.0.1:PORT` to the `watch` command.

Movies are matched only from a cleaned local filename. `Show.S02E03` filenames
are parsed as episodes. Uncertain filenames remain in AutoSync review rather
than being marked watched incorrectly.
