#!/bin/sh
# src 폴더의 조각들을 합쳐 index.html 한 파일로 만든다
cd "$(dirname "$0")" && { echo '<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>'; cat head.html; echo '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>'; echo '<script>'; cat core.js render.js cars.js game.js menu2.js; echo '</script></body></html>'; } > ../index.html
