#!/bin/sh
# src 폴더의 조각들을 합쳐 index.html 한 파일로 만든다 (head.html 맨 앞에 charset·viewport 메타 포함)
cd "$(dirname "$0")" && { echo '<!doctype html>'; cat head.html; echo '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>'; echo '<script>'; cat core.js render.js cars.js game.js menu2.js; echo '</script>'; } > ../index.html
