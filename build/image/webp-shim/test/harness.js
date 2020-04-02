/**
 * harness.js
 *
 * Example of how to use the webp-shim functions.
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2020 Google Inc.
 */
import {convertWebPtoPNG, convertWebPtoJPG} from '../../../image/webp-shim/webp-shim.js';

new Promise((resolve, reject) => {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', '../samples/norway.webp', true);
  xhr.responseType = 'arraybuffer'
  xhr.onload = evt => resolve(evt.target.response);
  xhr.onerror = err => reject(err);
  xhr.send(null);
}).then(webpBuffer => {
  convertWebPtoPNG(webpBuffer).then(pngArr => {
    document.getElementById('png').setAttribute('src',
        URL.createObjectURL(new Blob([pngArr], {type: 'image/png'})));
  });

  convertWebPtoJPG(webpBuffer).then(jpgArr => {
    document.getElementById('jpg').setAttribute('src',
        URL.createObjectURL(new Blob([jpgArr], {type: 'image/jpeg'})));
  });
});
