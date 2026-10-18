import assert from 'node:assert/strict';
import {parseYouTubeLink,parseTimecode,formatTimecode} from '../dist/youtube-link.js';
import {externalMoment} from '../dist/biomechanics-study.js';

assert.deepEqual(parseYouTubeLink('https://youtu.be/M7lc1UVf-VE?t=1m30s'),{id:'M7lc1UVf-VE',start:90,url:'https://www.youtube.com/watch?v=M7lc1UVf-VE'});
assert.equal(parseYouTubeLink('https://www.youtube.com/shorts/M7lc1UVf-VE')?.id,'M7lc1UVf-VE');
assert.equal(parseYouTubeLink('https://youtube.com.ejemplo.org/watch?v=M7lc1UVf-VE'),null);
assert.equal(parseYouTubeLink('javascript:alert(1)'),null);
assert.equal(parseTimecode('01:30'),90);
assert.equal(parseTimecode('1:90'),null);
assert.equal(formatTimecode(90),'01:30');
assert.ok(Math.abs(externalMoment(30,90,50).moment-15)<1e-10);
assert.ok(externalMoment(30,0,50).moment<1e-10);
assert.ok(Math.abs(externalMoment(60,90,50).moment-30)<1e-10);
console.log('Enlaces de YouTube y cálculo geométrico verificados.');
