# Nova OS

A console-style operating system with a **Library**, **App Store**, **Web browser**, preinstalled **games and apps**, and full **controller support**.

## Play it on Windows (the emulator)
Double-click **`Nova Emulator.bat`**. Nova boots in a window, just like a console emulator.

- **`Nova Console Mode.bat`**: same thing, but full screen like a real console
- **`Install on this PC.bat`**: puts a "Nova OS" shortcut on your Desktop and Start menu

## Controls
| Action | Keyboard | Controller |
|---|---|---|
| Move | Arrow keys | D-pad / left stick |
| Select | Enter | A |
| Back | Esc | B |
| Go Home from any app | F1 or Home | Home / Guide button |
| Quick menu in an app | the ⌂ Home pill at the top | Select / View |
| Power menu | ⏻ button top right | Start (on the dashboard) |
| Full screen | F11 | |

## What's inside
- **Home**: hero tile for your last game, recently played, pinned apps
- **Library**: everything installed, filtered by Games / Apps / Web apps
- **Nova Store**: install and uninstall games and apps, or turn **any website into an app**
- **Web**: a full browser with a start page, bookmarks, back/forward
- **Settings**: name, color, wallpaper, sounds, factory reset

Preinstalled: Neon Snake, Brick Breaker, Astro Dodge, Notes, Files.
In the Store: Memory Match, Paddle Duel, Paint, Calculator, Synth Pad, YouTube (TV mode), Wikipedia, Maps, Twitch, Spotify, Xbox Cloud Gaming.

## Downloading apps from the web
- In **Web**, download any game as a **.zip**, **.nova** or **.html** file and Nova installs it automatically. It shows up first on your Home screen.
- Or in the **Nova Store**, paste a link to one of those files under "Download an app from the web".
- Other files (pictures, PDFs…) are saved to your Downloads folder. See them all in **Downloads** (top row).
- To make your own downloadable app: zip a folder that has an `index.html`, and optionally a `nova.json`:
  `{ "name": "My Game", "icon": "🚀", "type": "game", "developer": "Me", "description": "..." }`

## Make the bootable .iso
The ISO boots straight into Nova from a USB stick, and its boot menu has **Install** to put Nova permanently on the computer.

**Option A, on this PC:** run **`Build ISO.bat`**. The first time, it shows how to turn on Debian for Windows (WSL): `wsl --install -d Debian` in an Admin terminal, then restart. It makes `dist\nova-os-amd64.iso` (about 1 GB, 20–60 minutes).

**Option B, in the cloud:** put this folder in its own GitHub repo. Then go to Actions → "Build Nova OS ISO" → Run workflow, and download the ISO from the run's Artifacts.

Then write the ISO to a USB stick with **Rufus** or **balenaEtcher** and boot the computer from it (usually F12, F11 or Esc at power-on).

## Install it on a real computer without the ISO
Nova runs on top of a small Linux base, the same idea as SteamOS or ChromeOS.

1. On another PC, download the official **Debian 12 netinst ISO** from debian.org and write it to a USB stick with **Rufus** or **balenaEtcher**.
2. Boot the target computer from the USB and install Debian. On the "Software selection" screen, **untick every desktop** and keep only "standard system utilities". This **erases that computer's drive**.
3. Copy this whole `game os` folder onto a USB stick, plug it in, then log in and run:
   ```
   sudo mount /dev/sdb1 /mnt          # your USB stick (check with: lsblk)
   cp -r "/mnt/game os" ~/nova && cd ~/nova
   sudo bash installer/install-nova.sh
   sudo reboot
   ```
4. The computer now boots into Nova OS. The power menu really turns it off or restarts it.
   To get back to Linux, press **Ctrl+Alt+F2**.

Ethernet works out of the box. For Wi-Fi, go to **Settings → Network → Find Wi-Fi networks**.

## Making your own apps
Put an HTML file in `os/apps/`, include `<script src="sdk.js"></script>`, and add it to `os/catalog.js`.
The SDK gives you `Nova.poll()`, `Nova.tap('a')`, `Nova.down('left')`, `Nova.save()/load()`, `Nova.toast()` and `Nova.home()`.
