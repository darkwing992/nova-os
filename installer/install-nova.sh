#!/usr/bin/env bash
# Nova OS installer for a real computer.
# Run on a fresh Debian 12 or Ubuntu Server/minimal install (no desktop needed):
#   sudo bash installer/install-nova.sh
# After a reboot the computer boots straight into Nova OS, like a game console.
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then echo "Run this with sudo: sudo bash $0"; exit 1; fi

SRC="$(cd "$(dirname "$0")/.." && pwd)"
DEST=/opt/nova-os
NOVA_USER=nova

echo "==> Installing system packages (graphics, sound, fonts, network)"
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y --no-install-recommends \
  xserver-xorg xinit x11-xserver-utils unclutter \
  nodejs npm ca-certificates \
  libnss3 libgtk-3-0 libgbm1 libxss1 libxtst6 libatk-bridge2.0-0 libdrm2 libasound2 libcups2 \
  pipewire pipewire-pulse wireplumber \
  fonts-noto-core fonts-noto-color-emoji \
  network-manager plymouth plymouth-themes

echo "==> Copying Nova OS to $DEST"
rm -rf "$DEST"
mkdir -p "$DEST"
cp -r "$SRC/os" "$SRC/main.js" "$SRC/preload.js" "$SRC/package.json" "$DEST/"
cd "$DEST"
npm install --omit=dev --no-audit --no-fund
chown root:root node_modules/electron/dist/chrome-sandbox
chmod 4755 node_modules/electron/dist/chrome-sandbox

echo "==> Creating the console user '$NOVA_USER'"
if ! id "$NOVA_USER" >/dev/null 2>&1; then
  useradd -m -s /bin/bash -G audio,video,input,netdev "$NOVA_USER" 2>/dev/null \
    || useradd -m -s /bin/bash -G audio,video,input "$NOVA_USER"
fi
passwd -d "$NOVA_USER" >/dev/null

echo "==> Booting straight into Nova OS"
mkdir -p /etc/systemd/system/getty@tty1.service.d
cat > /etc/systemd/system/getty@tty1.service.d/autologin.conf <<EOF
[Service]
ExecStart=
ExecStart=-/sbin/agetty --autologin $NOVA_USER --noclear %I \$TERM
EOF

HOME_DIR=$(getent passwd "$NOVA_USER" | cut -d: -f6)
cat > "$HOME_DIR/.bash_profile" <<'EOF'
if [ -z "$DISPLAY" ] && [ "$(tty)" = "/dev/tty1" ]; then
  exec startx -- -nocursor >/dev/null 2>&1
fi
EOF
cat > "$HOME_DIR/.xinitrc" <<'EOF'
xset s off -dpms s noblank
unclutter -idle 3 &
while true; do
  /opt/nova-os/node_modules/electron/dist/electron /opt/nova-os --console
  # if Nova closes or crashes it starts again; shutting down from the power menu turns the PC off
  sleep 1
done
EOF
chown "$NOVA_USER:$NOVA_USER" "$HOME_DIR/.bash_profile" "$HOME_DIR/.xinitrc"

# let the console user turn the machine off / restart from the Nova power menu
cat > /etc/polkit-1/rules.d/50-nova-power.rules 2>/dev/null <<EOF || true
polkit.addRule(function(action, subject) {
  if (subject.user == "$NOVA_USER" && (action.id.indexOf("org.freedesktop.login1.power-off") == 0 || action.id.indexOf("org.freedesktop.login1.reboot") == 0)) return polkit.Result.YES;
});
EOF

# quiet boot with a splash instead of scrolling text
if [ -f /etc/default/grub ]; then
  sed -i 's/^GRUB_CMDLINE_LINUX_DEFAULT=.*/GRUB_CMDLINE_LINUX_DEFAULT="quiet splash loglevel=3"/' /etc/default/grub
  sed -i 's/^GRUB_TIMEOUT=.*/GRUB_TIMEOUT=1/' /etc/default/grub
  plymouth-set-default-theme spinner 2>/dev/null || true
  update-grub || true
fi

systemctl enable NetworkManager >/dev/null 2>&1 || true
systemctl daemon-reload

echo
echo "Nova OS is installed! Reboot to start it:  sudo reboot"
echo "Tip: to get back to Linux, press Ctrl+Alt+F2 and log in with your normal account."
