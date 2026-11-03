/* Campus Creatives AI Studio — browser UI + secure Supabase Edge Function client.
   Provider credentials never enter browser code. */
(function(){
 'use strict';
 const $=id=>document.getElementById(id);
 const box=$('ccAiMessages'),promptEl=$('ccAiPrompt'),generate=$('ccAiGenerate'),download=$('ccAiDownload');
 if(!box||!generate)return;
 let lastUrl='',lastBrief='';
 function say(text,who='assistant'){const d=document.createElement('div');d.className='cc-ai-message '+(who==='user'?'cc-ai-user':'cc-ai-assistant');d.textContent=text;box.appendChild(d);box.scrollTop=box.scrollHeight;return d}
 function status(t){$('ccAiStatus').textContent=t}
 async function brandData(){
  const select=$('brandSelect'),list=typeof brandProfiles!=='undefined'?brandProfiles:[];
  let id=select.value,b=id?list.find(x=>String(x.id)===String(id)):null;
  if(!b&&id){const {data,error}=await sb.from('creative_brand_profiles').select('*').eq('id',id).maybeSingle();if(error)throw new Error('Could not load selected brand profile: '+error.message);b=data;}
  if(!b&&!id&&list.length){b=list.find(x=>x.logo_url)||list[0];select.value=String(b.id);}
  if(!b&&!id){const {data,error}=await sb.from('creative_brand_profiles').select('*').order('created_at',{ascending:false}).limit(1).maybeSingle();if(error)throw new Error('Could not load a saved brand profile: '+error.message);b=data;if(b)select.value=String(b.id);}
  if(!b)throw new Error('No saved client brand profile found. Save a brand profile first.');
  // Reuse the client's approved logo from another duplicate profile only when this profile has no logo.
  if(!b.logo_url){const {data}=await sb.from('creative_brand_profiles').select('logo_url').eq('brand_name',b.brand_name).not('logo_url','is',null).limit(1).maybeSingle();if(data?.logo_url)b={...b,logo_url:data.logo_url};}
  return b;
 }
 function copyFromBrief(brief,brand){
  const text=brief.replace(/https?:\/\/\S+/g,' ').replace(/\s+/g,' ').trim();
  const year=(text.match(/20\d{2}\s*[-–]\s*\d{2,4}/)||[])[0]||'2026–27';
  const festival=/sri\s*ram|rama\s*navami|ugadi|diwali|deepavali|dussehra|vijayadashami|ganesh|vinayaka|independence\s*day|teachers?\s*day|christmas|sankranti|holi|eid|bakrid|ramzan|ramadan|remedan/i.test(text);
  let title='YOUR POTENTIAL HAS NO LIMITS',kicker='DREAM. PREPARE. ACHIEVE.',subtitle='';
  if(/sri\s*ram|rama\s*navami/i.test(text)){title='SRI RAMA NAVAMI';kicker='MAY DHARMA AND PEACE GUIDE EVERY STEP';}
  else if(/ugadi/i.test(text)){title='HAPPY UGADI';kicker='WISHING YOU A YEAR OF NEW BEGINNINGS';}
  else if(/diwali|deepavali/i.test(text)){title='HAPPY DIWALI';kicker='MAY YOUR LIFE SHINE WITH JOY AND LIGHT';}
  else if(/dussehra|vijayadashami/i.test(text)){title='HAPPY DUSSEHRA';kicker='CELEBRATING THE VICTORY OF GOOD';}
  else if(/ganesh|vinayaka/i.test(text)){title='HAPPY GANESH CHATURTHI';kicker='MAY LORD GANESHA BLESS YOU';}
  else if(/ramadan|ramadhan|ramzan|ramazan|remedan|eid|bakrid|bakra eid/i.test(text)){title=/eid|bakrid|bakra eid/i.test(text)?'EID MUBARAK':'RAMADAN MUBARAK';kicker='WISHING YOU PEACE, BLESSINGS AND JOY';}
  else if(/independence\s*day/i.test(text)){title='HAPPY INDEPENDENCE DAY';kicker='CELEBRATING THE SPIRIT OF FREEDOM';}
  else if(/teachers?\s*day/i.test(text)){title='HAPPY TEACHERS’ DAY';kicker='HONOURING THOSE WHO INSPIRE';}
  else if(/admission|admissions|enrol|enroll|join/i.test(text)){title='ADMISSIONS OPEN';kicker='ADMISSIONS '+year;subtitle='IIT-JEE  •  NEET  •  EAPCET';}
  else if(/scholarship|talent test/i.test(text)){title='SCHOLARSHIP TEST';kicker='EXCEL WITH AGASTYA';}
  else if(/result|results/i.test(text)){title='CELEBRATING SUCCESS';kicker='STUDENT ACHIEVEMENTS';}
  else if(/neet/i.test(text)){title='DREAM BIG. AIM NEET.';kicker='YOUR MEDICAL JOURNEY STARTS HERE';}
  else if(/iit|jee/i.test(text)){title='AIM HIGHER. GO IIT.';kicker='YOUR IIT-JEE JOURNEY STARTS HERE';}
  else if(/event|fest|celebration|cultural/i.test(text)&&!festival){title='LET’S CELEBRATE';kicker='CAMPUS EVENT';}
  const explicit=text.match(/(?:headline|title)\s*[:\-]\s*([^.;]{3,65})/i);
  if(explicit)title=explicit[1].trim().toUpperCase();
  const quoted=text.match(/[“"]([^”"]{5,65})[”"]/);
  if(quoted&&!festival&&!/admission|scholarship|result/i.test(text))title=quoted[1].trim().toUpperCase();
  const isMotivational=/motivat|mindset|inspir|success|dream|achiev|potential|limits|discipline/i.test(text);
  if(isMotivational&&!festival&&!/admission|scholarship|result/i.test(text)&&!explicit&&!quoted){title='YOUR MINDSET DEFINES YOUR LIMITS';kicker='DREAM. PREPARE. ACHIEVE.';}
  if(!subtitle&&!festival&&/\bMPC\b|\bBiPC\b|\bMEC\b|\bCEC\b/i.test(text))subtitle='MPC  •  BiPC  •  MEC  •  CEC';
  return {title,kicker,subtitle,year,festival,isMotivational};
 }
 async function loadImage(url){
  const res=await fetch(url,{mode:'cors'});if(!res.ok)throw new Error('Could not load saved client logo.');const blob=await res.blob(),u=URL.createObjectURL(blob);
  try{return await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=u;});}finally{URL.revokeObjectURL(u)}
 }
 async function composite(artBlob,brand,brief){
  const [w,h]=$('ccAiSize').value.split('x').map(Number),canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext('2d'),artUrl=URL.createObjectURL(artBlob),art=await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=artUrl;});
  const copy=copyFromBrief(brief,brand),primary=/^#[0-9a-f]{6}$/i.test(brand.primary_color||'')?brand.primary_color:'#164b7a',accent=/^#[0-9a-f]{6}$/i.test(brand.secondary_color||'')?brand.secondary_color:'#f36b21';
  const margin=Math.round(w*.055),min=Math.min(w,h),isPortrait=h>=w;
  function roundedImage(im,x,y,ww,hh,r){ctx.save();ctx.beginPath();ctx.roundRect(x,y,ww,hh,r);ctx.clip();const s=Math.max(ww/im.width,hh/im.height),dw=im.width*s,dh=im.height*s;ctx.drawImage(im,x+(ww-dw)/2,y+(hh-dh)/2,dw,dh);ctx.restore();}
  function fitText(txt,maxWidth,start,minSize,weight='800'){let size=start;ctx.font=weight+' '+size+'px Arial';while(ctx.measureText(txt).width>maxWidth&&size>minSize){size-=2;ctx.font=weight+' '+size+'px Arial'}return size;}
  try{
   // Clean editorial poster system: bright white canvas, subtle geometry, generous spacing.
   ctx.fillStyle='#ffffff';ctx.fillRect(0,0,w,h);
   const glow=ctx.createRadialGradient(w*.92,h*.08,0,w*.92,h*.08,min*.42);glow.addColorStop(0,'rgba(31,112,174,.10)');glow.addColorStop(1,'rgba(31,112,174,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
   ctx.strokeStyle='rgba(32,111,166,.13)';ctx.lineWidth=Math.max(2,min*.004);ctx.beginPath();ctx.arc(-w*.08,h*.16,min*.22,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(w*1.08,h*.83,min*.18,0,Math.PI*2);ctx.stroke();
   // Original client logo only; portrait mockups are deliberately rejected.
   if(brand.logo_url){try{const logo=await loadImage(brand.logo_url);if(logo.width/logo.height<1.15)throw new Error('portrait/mockup');const maxW=w*.76,maxH=h*.105,s=Math.min(maxW/logo.width,maxH/logo.height),lw=logo.width*s,lh=logo.height*s;ctx.drawImage(logo,(w-lw)/2,margin*.55,lw,lh);}catch(e){console.warn('A clean horizontal client logo file is required; skipping logo.',e);}}
   const headerBottom=Math.round(h*.16);
   ctx.fillStyle=accent;ctx.fillRect(margin,headerBottom,w-margin*2,Math.max(2,min*.002));
   if(copy.festival){
    // Festival greeting layout: image-led, no college/campus content or dark corporate footer.
    const imageY=Math.round(h*.19),imageH=Math.round(h*.49);
    roundedImage(art,margin,imageY,w-margin*2,imageH,Math.round(min*.025));
    const titleY=imageY+imageH+Math.round(h*.045);
    ctx.fillStyle=primary;let fs=fitText(copy.title,w-margin*2,Math.round(min*.09),Math.round(min*.045),'900');ctx.font='900 '+fs+'px Arial';ctx.textAlign='center';ctx.fillText(copy.title,w/2,titleY);
    ctx.fillStyle=accent;ctx.fillRect(w*.38,titleY+fs*1.18,w*.24,Math.max(5,min*.008));
    ctx.fillStyle=primary;ctx.font='600 '+Math.round(min*.027)+'px Arial';ctx.fillText(copy.kicker,w/2,titleY+fs*1.5,w-margin*2);ctx.textAlign='left';
   }else{
    // Strong editorial hierarchy: oversized message first, meaningful visual concept second.
    const titleY=Math.round(h*.22),maxW=w-margin*2;
    ctx.textAlign='center';ctx.fillStyle=primary;
    let fs=fitText(copy.title,maxW,Math.round(min*.095),Math.round(min*.052),'900');ctx.font='900 '+fs+'px Arial';
    const words=copy.title.split(/\s+/);let lines=[],line='';
    for(const word of words){const next=line?line+' '+word:word;if(ctx.measureText(next).width>maxW&&line){lines.push(line);line=word}else line=next;}if(line)lines.push(line);
    let ty=titleY;for(const ln of lines.slice(0,3)){ctx.fillText(ln,w/2,ty);ty+=Math.round(fs*1.08);}
    ctx.fillStyle=accent;ctx.fillRect(w*.22,ty+Math.round(h*.012),w*.56,Math.max(5,min*.008));
    ctx.fillStyle=primary;ctx.font='700 '+Math.round(min*.033)+'px Arial';ctx.fillText(copy.kicker,w/2,ty+Math.round(h*.055),maxW);
    if(copy.subtitle){ctx.fillStyle=accent;ctx.font='700 '+Math.round(min*.027)+'px Arial';ctx.fillText(copy.subtitle,w/2,ty+Math.round(h*.105),maxW);}
    const artY=Math.round(h*.43),artH=Math.round(h*.39);
    roundedImage(art,margin,artY,w-margin*2,artH,Math.round(min*.018));
    if(copy.isMotivational){
      const labels=['DISCIPLINE','CONCEPTS','PRACTICE','CONFIDENCE','SUCCESS'],baseY=artY+artH-Math.round(h*.035),stepW=(w-margin*2)/labels.length;
      ctx.font='700 '+Math.round(min*.018)+'px Arial';ctx.textAlign='center';
      labels.forEach((label,i)=>{const x=margin+i*stepW;ctx.fillStyle='rgba(255,255,255,.94)';ctx.fillRect(x,baseY,stepW-3,Math.round(h*.035));ctx.fillStyle=primary;ctx.fillText(label,x+stepW/2,baseY+Math.round(h*.024),stepW-6);});
    }
    ctx.textAlign='left';
   }
   // Thin footer rule and accurate saved contact details.
   const ruleY=Math.round(h*.91);ctx.fillStyle=primary;ctx.fillRect(margin,ruleY,w-margin*2,Math.max(2,min*.002));
   const contact=[brand.phone,brand.website,brand.address].filter(Boolean);
   ctx.fillStyle=primary;ctx.font='600 '+Math.round(min*.022)+'px Arial';ctx.textAlign='center';
   const footer=contact.join('   |   ');ctx.fillText(footer,w/2,Math.round(h*.945),w-margin*2);ctx.textAlign='left';
   return await new Promise(resolve=>canvas.toBlob(resolve,'image/png',.96));
  }finally{URL.revokeObjectURL(artUrl)}
 }
 async function run(){
  const brief=promptEl.value.trim();
  if(!brief){status('First, describe the design you want.');return}
  generate.disabled=true;generate.textContent='Please wait…';status('Checking selected client profile…');
  let wait=null;
  try{
   const brand=await brandData();
   if(!brand||!brand.brand_name)throw new Error('Selected brand profile has no institution name.');
   say(brief,'user');promptEl.value='';lastBrief=brief;
   status('Sending request to secure AI service…');
   wait=say('Creating the artwork. This can take a little while…');
   const {data:{session}}=await sb.auth.getSession();if(!session)throw new Error('Please sign in again.');
   const {data,error}=await sb.functions.invoke('cc-ai-studio',{body:{prompt:brief,model:$('ccAiModel').value,size:$('ccAiSize').value,brand:{brand_name:brand.brand_name,primary_color:brand.primary_color,secondary_color:brand.secondary_color}}});
   if(error)throw error;if(!data||!data.image_base64)throw new Error(data?.error||'AI service returned no image.');
   const raw=atob(data.image_base64),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
   const blob=await composite(new Blob([bytes],{type:data.mime_type||'image/jpeg'}),brand,brief);
   if(!blob)throw new Error('Could not prepare PNG preview.');
   if(lastUrl)URL.revokeObjectURL(lastUrl);lastUrl=URL.createObjectURL(blob);
   $('ccAiPreview').className='';$('ccAiPreview').innerHTML='';const img=document.createElement('img');img.className='cc-ai-preview-img';img.alt='AI generated Campus Creatives design';img.src=lastUrl;$('ccAiPreview').appendChild(img);
   download.disabled=false;if(wait)wait.textContent='Your artwork is ready. The saved client logo and contact details were composited where available.';status('Generated successfully. Download the PNG or describe a change to create another version.');
  }catch(e){
   const message=e?.message||String(e);if(wait)wait.textContent='Generation could not start.';
   status(message.includes('POLLINATIONS_API_KEY')?'Provider key not configured. Check Supabase Edge Function secrets.':message);
   say('I could not generate the image: '+message);
  }finally{generate.disabled=false;generate.textContent='✦ Generate image'}
 }
 generate.addEventListener('click',run);
 promptEl.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();run()}});
 download.addEventListener('click',()=>{if(!lastUrl)return;const a=document.createElement('a');a.href=lastUrl;a.download='campus-creatives-ai-design.png';a.click()});
})();