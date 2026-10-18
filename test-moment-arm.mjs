import {externalMomentArm} from './dist/data.js';

const close=(actual,expected,label)=>{
  if(Math.abs(actual-expected)>1e-9)throw Error(`${label}: esperado ${expected}, recibido ${actual}`);
};
const horizontal=externalMomentArm(30,50,90,100);
close(horizontal.distanceMeters,.3,'Brazo externo a 90°');
close(horizontal.torqueNm,15,'Momento a 90°');
const vertical=externalMomentArm(30,50,0,100);
close(vertical.distanceMeters,0,'Brazo externo alineado con gravedad');
close(vertical.torqueNm,0,'Momento con línea de fuerza sobre el eje');
const longer=externalMomentArm(60,50,90,100);
close(longer.distanceMeters,.6,'Brazo externo al duplicar longitud');
close(longer.torqueNm,30,'Momento al duplicar longitud');
const midpoint=externalMomentArm(30,50,90,50);
close(midpoint.distanceMeters,.15,'Carga aplicada a mitad del segmento');
close(midpoint.torqueNm,7.5,'Momento con carga aplicada a mitad del segmento');
const angled=externalMomentArm(30,50,30,100);
close(angled.distanceMeters,.15,'Brazo externo a 30°');
console.log('Brazo de momento validado: efecto de longitud, ángulo y punto de aplicación.');
