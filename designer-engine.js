/* Campus Creatives local design renderer. No API key required. */
(function(){
 const $id=id=>document.getElementById(id);
 function draw(){
  const prompt=$id('designPrompt').value.trim();
  if(!prompt){$id('designerMsg').textContent='Design brief enter cheyyandi.';return;}
  const brand=(typeof brandProfiles!=='undefined'?brandProfiles:[]).find(x=>x.id===$id('brandSelect').value)||{};
  const form=$id('brandForm');
  const val=k=>brand[k]||(form.elements[k]?.value||'');
  const title=prompt.split(/[.!?\n]/)[0].trim();
  const type=$id('designType').value;
  let w=1080,h=1080;
  if(type.includes('Story'))h=1920;
  else if(type.includes('Portrait')||type.includes('WhatsApp'))h=1350;
  else if(type.includes('A4')){w=1240;h=1754;}
  else if(type.includes('Calendar')){w=1240;h=1754;}
  else if(type.includes('Facebook')){w=1640;h=624;}
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext('2d');
  const primary=val('primary_color')||'#07152e', accent=val('secondary_color')||'#f5c400';
  const g=ctx.createLinearGradient(0,0,w,h);g.addColorStop(0,primary);g.addColorStop(1,'#183c68');
  ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  ctx.globalAlpha=.16;ctx.fillStyle=accent;ctx.beginPath();ctx.arc(w*.88,h*.2,Math.min(w,h)*.28,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  ctx.fillStyle=accent;ctx.fillRect(w*.075,h*.075,w*.17,12);
  const pad=w*.075;
  ctx.fillStyle='#fff';ctx.font='bold '+Math.round(w*.032)+'px Arial';
  ctx.fillText((val('brand_name')||'YOUR BRAND').toUpperCase().slice(0,45),pad,h*.14);
  ctx.fillStyle=accent;ctx.font='bold '+Math.round(w*.018)+'px Arial';
  ctx.fillText(($id('designStyle').value||'CREATIVE DESIGN').toUpperCase(),pad,h*.19);
  ctx.fillStyle='#fff';ctx.font='900 '+Math.round(w*.078)+'px Arial';
  const words=title.toUpperCase().split(/\s+/);let line='',y=h*.34,lines=0;
  for(const word of words){const next=line?line+' '+word:word;if(ctx.measureText(next).width>w*.82&&line){ctx.fillText(line,pad,y);line=word;y+=w*.09;lines++;if(lines===3)break;}else line=next;}
  if(line)ctx.fillText(line,pad,y);
  ctx.fillStyle=accent;ctx.font='600 '+Math.round(w*.027)+'px Arial';
  const detail=$id('designText').value.trim()||prompt;
  const chunks=detail.match(/.{1,42}(?:\s|$)/g)||[detail];
  chunks.slice(0,5).forEach((t,i)=>ctx.fillText(t.trim(),pad,h*.58+i*w*.042));
  if(/calendar/i.test(type)){
   const now=new Date(),year=now.getFullYear(),month=now.getMonth(),first=new Date(year,month,1).getDay(),days=new Date(year,month+1,0).getDate();
   const gx=pad,gy=h*.39,cw=w*.85/7,ch=h*.052;
   ctx.fillStyle=accent;ctx.font='bold '+Math.round(w*.021)+'px Arial';
   ['SUN','MON','TUE','WED','THU','FRI','SAT'].forEach((d,i)=>ctx.fillText(d,gx+i*cw,gy));
   ctx.fillStyle='#fff';ctx.font=Math.round(w*.022)+'px Arial';
   for(let d=1;d<=days;d++){const n=first+d-1;ctx.fillText(String(d),gx+(n%7)*cw,gy+ch*(1+Math.floor(n/7)));}
  }
  const foot=[val('phone'),val('website'),val('address')].filter(Boolean).join('  •  ');
  ctx.fillStyle=accent;ctx.fillRect(0,h*.9,w,5);ctx.fillStyle='#fff';
  ctx.font='600 '+Math.round(w*.019)+'px Arial';ctx.fillText(foot||'Add contact details in Brand Profile',pad,h*.94,w*.85);
  const show=url=>{
   $id('designPreview').className='';
   $id('designPreview').innerHTML='<div style="display:grid;gap:14px"><img alt="Design preview" src="'+url+'" style="display:block;max-width:100%;max-height:720px;object-fit:contain;margin:auto;border-radius:12px"><a class="btn" style="text-align:center" download="campus-creatives-design.png" href="'+url+'">Download PNG</a><p class="muted">Locally rendered composition. AI-generated photography needs a hosted image model.</p></div>';
   $id('designerMsg').textContent='Design ready. PNG download available.';
  };
  const logo=brand.logo_url;
  if(logo){const im=new Image();im.crossOrigin='anonymous';im.onload=()=>{ctx.drawImage(im,w-pad-w*.13,h*.06,w*.13,w*.13);show(canvas.toDataURL('image/png'));};im.onerror=()=>show(canvas.toDataURL('image/png'));im.src=logo;}
  else show(canvas.toDataURL('image/png'));
 }
 const btn=document.getElementById('generateDesignBtn');
 if(btn)btn.addEventListener('click',()=>{try{draw();}catch(e){document.getElementById('designerMsg').textContent='Render error: '+e.message;}});
})();