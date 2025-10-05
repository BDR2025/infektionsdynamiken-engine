# Boot ESM · Skeleton

This package provides a small, deterministic boot sequence:

Order:
1) /app/boot/tooltips/boot.js   → styles + layer + cursor tooltip (header ignored)
2) /app/pointer-bridge.js       → timeline:set → sim:pointer (idempotent, seed/clear)
3) /app/boot-engine.js          → environment / engine init
4) /app/mount-widgets.js        → mounts all widgets (uses /app/rehydrate.js)

Public entry in HTML:
<script type="module" src="../12-4_support/app/boot.js"></script>
