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
  let title='MAKE YOUR FUTURE HAPPEN',kicker='A NEW ACADEMIC JOURNEY';
  if(/sri\\s*ram|rama\\s*navami/i.test(text)){title='SRI RAMA NAVAMI';kicker='MAY DHARMA AND PEACE GUIDE EVERY STEP';}
  else if(/ugadi/i.test(text)){title='HAPPY UGADI';kicker='WISHING YOU A YEAR OF NEW BEGINNINGS';}
  else if(/diwali|deepavali/i.test(text)){title='HAPPY DIWALI';kicker='MAY YOUR LIFE SHINE WITH JOY AND LIGHT';}
  else if(/dussehra|vijayadashami/i.test(text)){title='HAPPY DUSSEHRA';kicker='CELEBRATING THE VICTORY OF GOOD';}
  else if(/ganesh|vinayaka/i.test(text)){title='HAPPY GANESH CHATURTHI';kicker='MAY LORD GANESHA BLESS YOU';}
  else if(/independence\\s*day/i.test(text)){title='HAPPY INDEPENDENCE DAY';kicker='CELEBRATING THE SPIRIT OF FREEDOM';}
  else if(/teachers?\\s*day/i.test(text)){title='HAPPY TEACHERS’ DAY';kicker='HONOURING THOSE WHO INSPIRE';}
  if(/admission|admissions|enrol|enroll|join/i.test(text)){title='ADMISSIONS OPEN';kicker='ADMISSIONS '+year;}
  else if(/scholarship|talent test/i.test(text)){title='SCHOLARSHIP TEST';kicker='EXCEL WITH AGASTYA';}
  else if(/result|results/i.test(text)){title='CELEBRATING SUCCESS';kicker='STUDENT ACHIEVEMENTS';}
  else if(/event|fest|celebration|cultural/i.test(text)){title='LET’S CELEBRATE';kicker='CAMPUS EVENT';}
  else if(/neet/i.test(text)){title='DREAM BIG. AIM NEET.';kicker='YOUR MEDICAL JOURNEY STARTS HERE';}
  else if(/iit|jee/i.test(text)){title='AIM HIGHER. GO IIT.';kicker='YOUR IIT-JEE JOURNEY STARTS HERE';}
  const explicit=text.match(/(?:headline|title)\s*[:\-]\s*([^.;]{3,65})/i);
  if(explicit)title=explicit[1].trim().toUpperCase();
  const groups=/\bMPC\b/i.test(text)||/\bBiPC\b/i.test(text)||/\bMEC\b/i.test(text)||/\bCEC\b/i.test(text)
   ? 'MPC  •  BiPC  •  MEC  •  CEC'
   : (/admission|admissions|junior college/i.test(text)?'IIT-JEE  •  NEET  •  EAPCET':'');
  return {title,kicker,subtitle:groups,year};
 }
 async function loadImage(url){
  const res=await fetch(url,{mode:'cors'});if(!res.ok)throw new Error('Could not load saved client logo.');const blob=await res.blob(),u=URL.createObjectURL(blob);
  try{return await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=u;});}finally{URL.revokeObjectURL(u)}
 }
 async function composite(artBlob,brand,brief){
  const [w,h]=$('ccAiSize').value.split('x').map(Number),canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext('2d'),artUrl=URL.createObjectURL(artBlob);
  try{const art=await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=artUrl;});const scale=Math.max(w/art.width,h/art.height),dw=art.width*scale,dh=art.height*scale;ctx.drawImage(art,(w-dw)/2,(h-dh)/2,dw,dh);}finally{URL.revokeObjectURL(artUrl)}
  const primary=/^#[0-9a-f]{6}$/i.test(brand.primary_color||'')?brand.primary_color:'#087f8c';
  const accent=/^#[0-9a-f]{6}$/i.test(brand.secondary_color||'')?brand.secondary_color:'#e38b22';
  const margin=Math.round(w*.055),topH=Math.round(h*.17),footerY=Math.round(h*.68);
  // Quiet logo header with enough space to keep the original logo readable.
  const header=ctx.createLinearGradient(0,0,0,topH);header.addColorStop(0,'rgba(5,18,35,.72)');header.addColorStop(1,'rgba(5,18,35,0)');
  ctx.fillStyle=header;ctx.fillRect(0,0,w,topH);
  if(brand.logo_url){
   try{const logo=await loadImage(brand.logo_url);if(logo.width/logo.height<1.15)throw new Error('The saved logo file looks like a portrait/mockup image, not a horizontal logo. Upload the original logo file.');const maxW=w*.42,maxH=h*.105,scale=Math.min(maxW/logo.width,maxH/logo.height),lw=logo.width*scale,lh=logo.height*scale,x=margin,y=Math.round(h*.035);
    ctx.save();ctx.shadowColor='rgba(0,0,0,.18)';ctx.shadowBlur=18;ctx.fillStyle='rgba(255,255,255,.97)';ctx.beginPath();ctx.roundRect(x-14,y-12,lw+28,lh+24,16);ctx.fill();ctx.restore();ctx.drawImage(logo,x,y,lw,lh);
   }catch(e){console.warn('Saved logo could not be composited:',e);}
  }
  // Full-width cinematic footer; image remains visible above it.
  const shade=ctx.createLinearGradient(0,footerY-h*.12,0,h);shade.addColorStop(0,'rgba(4,15,32,0)');shade.addColorStop(.25,'rgba(4,15,32,.88)');shade.addColorStop(1,'rgba(4,15,32,.97)');ctx.fillStyle=shade;ctx.fillRect(0,footerY-h*.12,w,h-(footerY-h*.12));
  ctx.fillStyle=accent;ctx.fillRect(margin,footerY+Math.round(h*.035),Math.round(w*.085),Math.max(8,Math.round(h*.009)));
  const copy=copyFromBrief(brief,brand),kickerY=footerY+Math.round(h*.075);
  ctx.textBaseline='top';ctx.fillStyle='#ffffff';ctx.font='700 '+Math.round(w*.025)+'px Arial';ctx.fillText(copy.kicker.toUpperCase(),margin,kickerY,w-margin*2);
  ctx.fillStyle='#ffffff';let fs=Math.round(w*.087);ctx.font='900 '+fs+'px Arial';
  while(ctx.measureText(copy.title).width>w-margin*2&&fs>Math.round(w*.052)){fs-=2;ctx.font='900 '+fs+'px Arial'}
  const titleY=kickerY+Math.round(h*.055);ctx.fillText(copy.title,margin,titleY,w-margin*2);
  let detailY=titleY+Math.round(fs*1.18);
  if(copy.subtitle){ctx.fillStyle='#f6d36a';ctx.font='700 '+Math.round(w*.027)+'px Arial';ctx.fillText(copy.subtitle,margin,detailY,w-margin*2);detailY+=Math.round(h*.052);}
  const contact=[brand.phone,brand.website,brand.address].filter(Boolean).join('   •   ');
  if(contact){ctx.fillStyle='rgba(255,255,255,.9)';ctx.font='500 '+Math.round(w*.019)+'px Arial';ctx.fillText(contact,margin,h-Math.round(h*.055),w-margin*2);}
  return await new Promise(resolve=>canvas.toBlob(resolve,'image/png',.96));
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