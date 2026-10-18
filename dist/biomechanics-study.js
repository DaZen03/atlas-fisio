export function externalMoment(lengthCm,angleDeg,forceN){
  const length=Number(lengthCm),angle=Number(angleDeg),force=Number(forceN);
  if(![length,angle,force].every(Number.isFinite)||length<0||force<0)throw new RangeError('Longitud, ángulo y fuerza deben ser números válidos.');
  const arm=length/100*Math.abs(Math.sin(angle*Math.PI/180));
  return {arm,moment:arm*force};
}

if(typeof document!=='undefined'){
  const section=document.querySelector('.geometry-section');
  if(section){
    const $=id=>document.getElementById(id);
    const segment=$('case-segment'),length=$('case-length'),angle=$('case-angle'),force=$('case-force');
    const defaults={upperArm:32,forearm:27,thigh:43,lowerLeg:40};
    segment.value=section.dataset.defaultSegment||'forearm';
    length.value=defaults[segment.value];
    function render(){
      const L=Number(length.value),theta=Number(angle.value),F=Number(force.value);
      const result=externalMoment(L,theta,F);
      $('case-length-value').textContent=`${L} cm`;
      $('case-angle-value').textContent=`${theta}°`;
      $('case-force-value').textContent=`${F} N`;
      $('case-arm-result').textContent=`${(result.arm*100).toLocaleString('es',{maximumFractionDigits:1})} cm`;
      $('case-moment-result').textContent=`${result.moment.toLocaleString('es',{maximumFractionDigits:1})} N·m`;
      const r=60+(L-15)*.9,rad=theta*Math.PI/180,x=98+r*Math.sin(rad),y=135+r*Math.cos(rad);
      $('case-segment-line').setAttribute('x2',x.toFixed(1));$('case-segment-line').setAttribute('y2',y.toFixed(1));
      $('case-load').setAttribute('cx',x.toFixed(1));$('case-load').setAttribute('cy',y.toFixed(1));
      $('case-gravity').setAttribute('x1',x.toFixed(1));$('case-gravity').setAttribute('x2',x.toFixed(1));
      $('case-gravity').setAttribute('y1',String(Math.max(12,y-73).toFixed(1)));
      $('case-gravity').setAttribute('y2',String(Math.min(245,y+72).toFixed(1)));
      $('case-distance').setAttribute('x2',x.toFixed(1));
      $('case-distance-label').setAttribute('x',String((98+x)/2-9));
      $('case-force-label').setAttribute('x',String(Math.min(370,x+12)));
      $('case-trajectory').setAttribute('d',theta===0?'':`M 98 ${135+r} A ${r} ${r} 0 0 0 ${x.toFixed(1)} ${y.toFixed(1)}`);
      $('case-diagram-desc').textContent=`${segment.options[segment.selectedIndex].text}: ${L} cm, ${theta} grados respecto a la fuerza vertical. Brazo externo ${(result.arm*100).toFixed(1)} centímetros y momento ${result.moment.toFixed(1)} newton metro. El recorrido es un esquema hipotético.`;
    }
    segment.addEventListener('change',()=>{length.value=defaults[segment.value];render()});
    for(const input of [length,angle,force])input.addEventListener('input',render);
    render();
  }
}
