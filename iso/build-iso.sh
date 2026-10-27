#!/usr/bin/env bash
# Builds a bootable Nova OS .iso (Debian 12 base + Nova as the whole desktop).
# The ISO boots straight into Nova from a USB stick, and its boot menu has "Install"
# to put Nova OS permanently on the computer's drive.
#
# Run as root on Debian 12 (or in WSL Debian, or GitHub Actions):
#   sudo bash iso/build-iso.sh
# Output: dist/nova-os-amd64.iso
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then echo "Run as root: sudo bash $0"; exit 1; fi

SRC="$(cd "$(dirname "$0")/.." && pwd)"
WORK="${WORK:-/tmp/nova-iso}"
OUT="${OUT:-$SRC/dist}"
ELECTRON_VERSION="$(grep -m1 '"version"' "$SRC/node_modules/electron/package.json" 2>/dev/null | sed -E 's/.*"([0-9.]+)".*/\1/' || true)"
ELECTRON_VERSION="${ELECTRON_VERSION:-33.4.11}"

echo "==> Installing build tools"
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y live-build debootstrap curl unzip ca-certificates

echo "==> Preparing build folder $WORK"
rm -rf "$WORK"
mkdir -p "$WORK" "$OUT"
cd "$WORK"

lb config \
  --distribution bookworm \
  --archive-areas "main contrib non-free non-free-firmware" \
  --binary-images iso-hybrid \
  --debian-installer live \
  --debian-installer-distribution bookworm \
  --iso-application "Nova OS" \
  --iso-volume "NOVA_OS" \
  --iso-publisher "Nova OS" \
  --bootappend-live "boot=live components nocomponents=user-setup,sudo,login,xinit quiet splash loglevel=3 hostname=nova" \
  --memtest none

echo "==> Package list"
cat > config/package-lists/nova.list.chroot <<'EOF'
live-boot
live-config
live-config-systemd
systemd-sysv
sudo
xserver-xorg-core
xserver-xorg-video-all
xserver-xorg-input-all
xinit
x11-xserver-utils
unclutter
libnss3
libgtk-3-0
libgbm1
libxss1
libxtst6
libatk-bridge2.0-0
libdrm2
libasound2
libcups2
libsecret-1-0
libnotify4
xdg-utils
pipewire
pipewire-pulse
wireplumber
fonts-noto-core
fonts-noto-color-emoji
network-manager
firmware-linux-free
firmware-misc-nonfree
firmware-iwlwifi
firmware-realtek
firmware-atheros
plymouth
plymouth-themes
EOF

echo "==> Adding Nova OS files"
APPDIR=config/includes.chroot/opt/nova-os
mkdir -p "$APPDIR/node_modules"
cp -r "$SRC/os" "$SRC/main.js" "$SRC/preload.js" "$SRC/package.json" "$APPDIR/"
cp -r "$SRC/node_modules/adm-zip" "$APPDIR/node_modules/"

echo "==> Downloading Electron $ELECTRON_VERSION for Linux"
curl -fL --retry 3 -o /tmp/electron-linux.zip \
  "https://github.com/electron/electron/releases/download/v${ELECTRON_VERSION}/electron-v${ELECTRON_VERSION}-linux-x64.zip"
mkdir -p "$APPDIR/electron"
unzip -q -o /tmp/electron-linux.zip -d "$APPDIR/electron"

# boot straight into Nova: auto-login on screen 1, start X, run Nova full screen
mkdir -p config/includes.chroot/etc/systemd/system/getty@tty1.service.d
cat > config/includes.chroot/etc/systemd/system/getty@tty1.service.d/autologin.conf <<'EOF'
[Service]
ExecStart=
ExecStart=-/sbin/agetty --autologin nova --noclear %I $TERM
EOF
mkdir -p config/includes.chroot/opt/nova-os/session
cat > config/includes.chroot/opt/nova-os/session/bash_profile <<'EOF'
if [ -z "$DISPLAY" ] && [ "$(tty)" = "/dev/tty1" ]; then
  exec startx -- -nocursor >/dev/null 2>&1
fi
EOF
cat > config/includes.chroot/opt/nova-os/session/xinitrc <<'EOF'
xset s off -dpms s noblank
unclutter -idle 3 &
while true; do
  /opt/nova-os/electron/electron /opt/nova-os --console
  sleep 1
done
EOF

# runs inside the image while it is being built
cat > config/hooks/live/0100-nova.hook.chroot <<'EOF'
#!/bin/sh
set -e
id nova >/dev/null 2>&1 || useradd -m -s /bin/bash -G audio,video,input,netdev,plugdev nova
passwd -d nova
cp /opt/nova-os/session/bash_profile /home/nova/.bash_profile
cp /opt/nova-os/session/xinitrc /home/nova/.xinitrc
chown -R nova:nova /home/nova
chown root:root /opt/nova-os/electron/chrome-sandbox
chmod 4755 /opt/nova-os/electron/chrome-sandbox
chmod +x /opt/nova-os/electron/electron
systemctl enable NetworkManager || true
plymouth-set-default-theme spinner || true
EOF
chmod +x config/hooks/live/0100-nova.hook.chroot

echo "==> Building the image (this takes a while: 20-60 minutes)"
lb build 2>&1 | tee "$OUT/build.log"

ISO="$(ls -1 "$WORK"/*.iso | head -1)"
cp "$ISO" "$OUT/nova-os-amd64.iso"
echo
echo "Done! Your ISO is at: $OUT/nova-os-amd64.iso"
ls -lh "$OUT/nova-os-amd64.iso"
