/* Campus Creatives Studio Renderer v2
 * Offline, browser-local poster composition. No API key or paid service.
 * This is a graphic renderer, not an AI photo-generation model.
 */
(function(){
 'use strict';
 const $=id=>document.getElementById(id);
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const hex=(h)=>/^#[0-9a-f]{6}$/i.test(h||'')?h:'#10264b';
 function rr(c,x,y,w,h,r,fill,stroke){c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke()}}
 function wrap(c,text,max,font){c.font=font;const words=String(text||'').split(/\s+/);const out=[];let line='';for(const word of words){const t=line?line+' '+word:word;if(c.measureText(t).width>max&&line){out.push(line);line=word}else line=t}if(line)out.push(line);return out}
 function draw(){
  const prompt=$('designPrompt').value.trim(),type=$('designType').value,style=($('designStyle').value||'Premium Editorial').toLowerCase();
  if(!prompt){$('designerMsg').textContent='Please enter a design brief.';return}
  const profiles=typeof brandProfiles!=='undefined'?brandProfiles:[];
  const brand=profiles.find(x=>x.id===$('brandSelect').value)||{};
  const form=$('brandForm'),v=k=>brand[k]||(form&&form.elements[k]?form.elements[k].value:'');
  if(!v('brand_name')){$('designerMsg').textContent='Select or complete a brand profile first.';return}
  let w=1080,h=1080;
  if(/story/i.test(type)){h=1920}else if(/portrait|whatsapp/i.test(type)){h=1350}else if(/A4|calendar/i.test(type)){w=1240;h=1754}else if(/Facebook/i.test(type)){w=1640;h=624}
  const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d'),p=hex(v('primary_color')),a=hex(v('secondary_color')||'#f5c400'),pad=w*.075;
  const isLight=/minimal|clean|corporate|elegant|premium/i.test(style),isBold=/bold|energetic|modern|vibrant|creative/i.test(style);
  // Keep the canvas clean and light: client colours are typography/accent colours, not a full-bleed background.
  const bg='#ffffff',fg=p,muted='#526176';
  x.fillStyle=bg;x.fillRect(0,0,w,h);
  // Subtle neutral panel and restrained brand-colour accents.
  x.fillStyle='#f5f7fb';x.fillRect(0,h*.19,w,h*.68);
  x.save();x.globalAlpha=isLight ? 0.08 : 0.22;x.fillStyle=a;x.beginPath();x.arc(w*.91,h*.16,Math.min(w,h)*.34,0,Math.PI*2);x.fill();x.restore();
  x.save();x.globalAlpha=isLight ? 0.06 : 0.13;x.strokeStyle=a;x.lineWidth=Math.max(2,w*.002);for(let i=0;i<8;i++){x.beginPath();x.arc(w*.88,h*.16,Math.min(w,h)*(.12+i*.035),0,Math.PI*2);x.stroke()}x.restore();
  // Header band / brand lockup
  rr(x,pad*.72,h*.055,w*.86,h*.105,w*.018,'#ffffff','#e4e9f1');
  const logo=v('logo_url');
  x.fillStyle=a;rr(x,pad,h*.075,w*.012,h*.065,5,a);
  x.fillStyle=fg;x.font='800 '+Math.round(w*.027)+'px Arial';x.fillText(String(v('brand_name')).toUpperCase().slice(0,36),pad+w*.035,h*.112);
  x.fillStyle=muted;x.font='600 '+Math.round(w*.012)+'px Arial';x.fillText('OFFICIAL CREATIVE',pad+w*.035,h*.143);
  // Decorative side label
  x.save();x.translate(w*.94,h*.54);x.rotate(Math.PI/2);x.fillStyle=a;x.font='700 '+Math.round(w*.013)+'px Arial';x.fillText('CAMPUS CREATIVES  •  DESIGN STUDIO',0,0);x.restore();
  function makeHeadline(raw){
   if(/admission/i.test(raw)) return /open/i.test(raw) ? 'ADMISSIONS OPEN' : 'ADMISSIONS OPEN';
   if(/calendar/i.test(raw)) return 'ACADEMIC CALENDAR';
   if(/scholarship/i.test(raw)) return 'SCHOLARSHIP PROGRAM';
   if(/exam|test/i.test(raw)) return 'EXAM NOTIFICATION';
   let t=raw.replace(/^(please\\s+)?(create|make|design|generate|prepare)\\s+(a|an|the)?\\s*/i,'');
   t=t.replace(/\\b(poster|design|use|using|with|branding|brand|logo|colours?|colors?|for|based on)\\b/ig,' ').replace(/\\s+/g,' ').trim();
   return (t||'YOUR HEADLINE').slice(0,52).toUpperCase();
  }
  const title=makeHeadline(prompt);
  const titleSize=Math.round(w*(isBold ? 0.082 : 0.070)),titleFont='900 '+titleSize+'px Arial';
  const titleLines=wrap(x,title,w*.79,titleFont).slice(0,4);
  let y=h*(/calendar/i.test(type)?.235:.34);
  x.fillStyle=a;x.font='800 '+Math.round(w*.017)+'px Arial';x.fillText(($('designStyle').value||'SIGNATURE SERIES').toUpperCase().slice(0,32),pad,y-w*.055);
  x.fillStyle=fg;x.font=titleFont;
  titleLines.forEach(line=>{x.fillText(line,pad,y);y+=titleSize*1.04});
  // Supporting copy in a clean card
  const detail=$('designText').value.trim(),cardY=Math.max(y+w*.045,h*.53),cardH=Math.min(h*.23,h-cardY-w*.22);
  rr(x,pad,cardY,w*.79,cardH,w*.018,isLight?'#ffffff':'#ffffff12',isLight?'#e6ebf3':'#ffffff24');
  x.fillStyle=a;x.fillRect(pad,cardY,w*.012,cardH);
  const bodyFont='500 '+Math.round(w*.024)+'px Arial',lines=wrap(x,detail,w*.70,bodyFont).slice(0,6);
  x.fillStyle=muted;x.font=bodyFont;lines.forEach((line,i)=>x.fillText(line,pad+w*.035,cardY+w*.06+i*w*.039));
  // Calendar grid
  if(/calendar/i.test(type)){
   const now=new Date(),yr=now.getFullYear(),mo=now.getMonth(),first=new Date(yr,mo,1).getDay(),days=new Date(yr,mo+1,0).getDate();
   const gx=pad,gy=h*.48,cw=w*.79/7,ch=h*.045;
   x.fillStyle=a;x.font='800 '+Math.round(w*.017)+'px Arial';['SUN','MON','TUE','WED','THU','FRI','SAT'].forEach((d,i)=>x.fillText(d,gx+i*cw,gy));
   x.strokeStyle=isLight?'#e5eaf2':'#ffffff25';x.lineWidth=2;
   for(let r=0;r<6;r++){for(let col=0;col<7;col++){const xx=gx+col*cw,yy=gy+ch*(.35+r);x.strokeRect(xx,yy,cw, ch*.92)}}
   x.fillStyle=fg;x.font='600 '+Math.round(w*.018)+'px Arial';
   for(let d=1;d<=days;d++){const n=first+d-1;x.fillText(String(d),gx+(n%7)*cw+cw*.12,gy+ch*(.95+Math.floor(n/7)))}
   x.fillStyle=fg;x.font='800 '+Math.round(w*.04)+'px Arial';x.fillText(now.toLocaleString('en',{month:'long'}).toUpperCase()+' '+yr,pad,h*.43);
  }
  // Footer with contact details
  const foot=[v('phone'),v('website'),v('address')].filter(Boolean).join('   •   ');
  x.fillStyle=a;x.fillRect(0,h*.91,w,h*.004);
  x.fillStyle=fg;x.font='700 '+Math.round(w*.017)+'px Arial';x.fillText(foot||'ADD CONTACT DETAILS TO BRAND PROFILE',pad,h*.955,w*.82);
  const finish=url=>{
   $('designPreview').className='';
   $('designPreview').innerHTML='<div style="display:grid;gap:12px"><img alt="Generated poster preview" src="'+url+'" style="display:block;width:100%;max-height:720px;object-fit:contain;margin:auto;border-radius:12px;background:#edf1f7"><a class="btn" style="display:block;text-align:center" download="campus-creatives-poster.png" href="'+url+'">Download high-resolution PNG</a><small style="color:#718096">Offline graphic composition • no API or credits used. AI-generated photography is not included.</small></div>';
   $('designerMsg').textContent='Poster composition ready. Download the PNG to use it.';
  };
  const finishWithLogo=async()=>{
   if(!logo){
    $('designerMsg').textContent='No logo URL is saved for this selected brand. Open Brand Profile, upload the logo and save again.';
    finish(c.toDataURL('image/png'));return;
   }
   try{
    // Fetch as a CORS-readable blob before drawing, so PNG export includes the logo.
    const response=await fetch(logo,{mode:'cors',cache:'no-store'});
    if(!response.ok)throw new Error('Logo request failed ('+response.status+').');
    const blob=await response.blob();
    if(!blob.type.startsWith('image/'))throw new Error('Saved logo URL is not an image.');
    const objectUrl=URL.createObjectURL(blob);
    const im=new Image();
    im.onload=()=>{
     const maxW=w*.19,maxH=h*.14,scale=Math.min(maxW/im.naturalWidth,maxH/im.naturalHeight);
     const iw=im.naturalWidth*scale,ih=im.naturalHeight*scale;
     // White logo plate ensures transparent/white logos remain visible.
     rr(x,w-pad-iw-w*.025,h*.065,iw+w*.025,ih+w*.025,10,'#ffffff','#e5eaf2');
     x.drawImage(im,w-pad-iw-w*.0125,h*.077,iw,ih);
     URL.revokeObjectURL(objectUrl);
     try{finish(c.toDataURL('image/png'))}
     catch(err){$('designerMsg').textContent='Logo was loaded but PNG export was blocked by image security settings.';console.error(err)}
    };
    im.onerror=()=>{URL.revokeObjectURL(objectUrl);$('designerMsg').textContent='Saved logo file could not be decoded. Please upload PNG, JPG or WEBP again.';finish(c.toDataURL('image/png'))};
    im.src=objectUrl;
   }catch(err){
    $('designerMsg').textContent='Logo could not be loaded: '+err.message+' Check that cc-assets is public, then re-upload the logo.';
    finish(c.toDataURL('image/png'));
   }
  };
  finishWithLogo();
 }
 const btn=$('generateDesignBtn');if(btn)btn.addEventListener('click',()=>{try{draw()}catch(e){$('designerMsg').textContent='Could not render: '+e.message}});
})();