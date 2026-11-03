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
 async function brandData(){const id=$('brandSelect').value;const list=typeof brandProfiles!=='undefined'?brandProfiles:[];let b=list.find(x=>String(x.id)===String(id));if(!b&&id){const {data,error}=await sb.from('creative_brand_profiles').select('*').eq('id',id).maybeSingle();if(error)throw new Error('Could not load selected brand profile: '+error.message);b=data;}if(!b)throw new Error('Select a saved client brand profile from the dropdown. If you just saved one, tap Refresh and select it again.');return b;}
 function headline(s){let t=s.replace(/https?:\/\/\S+/g,'').split(/[.!?\n]/)[0].trim();t=t.replace(/^(please\s+)?(create|make|design|generate|prepare)\s+(a|an|the)?\s*/i,'');return t.slice(0,64).toUpperCase()}
 async function composite(artBlob,brand,brief){
  const size=$('ccAiSize').value.split('x').map(Number),w=size[0],h=size[1],canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext('2d'),artUrl=URL.createObjectURL(artBlob);
  try{
   const art=await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=artUrl});
   ctx.drawImage(art,0,0,w,h);
  }finally{URL.revokeObjectURL(artUrl)}
  // Add a restrained white brand lockup plate to preserve logo fidelity.
  if(brand.logo_url){
   try{
    const resp=await fetch(brand.logo_url,{mode:'cors'});if(!resp.ok)throw new Error('Logo fetch failed');const blob=await resp.blob(),u=URL.createObjectURL(blob);
    try{const logo=await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=u});const maxW=w*.2,maxH=h*.13,scale=Math.min(maxW/logo.width,maxH/logo.height),lw=logo.width*scale,lh=logo.height*scale,x=w*.73-lw*.05,y=h*.035;ctx.fillStyle='rgba(255,255,255,.96)';ctx.shadowColor='rgba(0,0,0,.16)';ctx.shadowBlur=16;ctx.fillRect(x-12,y-10,lw+24,lh+20);ctx.shadowBlur=0;ctx.drawImage(logo,x,y,lw,lh)}finally{URL.revokeObjectURL(u)}
   }catch(e){console.warn('Logo overlay skipped:',e)}
  }
  const title=headline(brief),primary=/^#[0-9a-f]{6}$/i.test(brand.primary_color||'')?brand.primary_color:'#10264b';
  // Put editable headline/contact overlay on a soft translucent strip, avoiding baked-in AI text.
  const stripH=Math.round(h*.24),y=h-stripH;ctx.fillStyle='rgba(255,255,255,.93)';ctx.fillRect(0,y,w,stripH);
  ctx.fillStyle=brand.secondary_color||'#f5c400';ctx.fillRect(0,y,w*.018,stripH);
  ctx.fillStyle=primary;ctx.font='900 '+Math.round(w*.052)+'px Arial';ctx.textBaseline='top';
  const words=title.split(/\\s+/);let line='',lines=[];for(const word of words){const test=line?line+' '+word:word;if(ctx.measureText(test).width>w*.88&&line){lines.push(line);line=word}else line=test}if(line)lines.push(line);lines.slice(0,2).forEach((l,i)=>ctx.fillText(l,w*.06,y+stripH*.16+i*w*.06));
  const contact=[brand.phone,brand.website,brand.address].filter(Boolean).join('   •   ');
  if(contact){ctx.fillStyle='#344256';ctx.font='600 '+Math.round(w*.018)+'px Arial';ctx.fillText(contact.slice(0,150),w*.06,y+stripH*.78,w*.88)}
  return await new Promise(resolve=>canvas.toBlob(resolve,'image/png',.96));
 }
 async function run(){
  const brief=promptEl.value.trim();if(!brief){status('First, describe the design you want.');return}
  const brand=await brandData();if(!brand||!brand.brand_name)throw new Error('Selected brand profile has no institution name.');
  say(brief,'user');promptEl.value='';lastBrief=brief;generate.disabled=true;generate.textContent='Generating…';status('Sending request to secure AI service…');
  const wait=say('Creating the artwork. This can take a little while…');
  try{
   const {data:{session}}=await sb.auth.getSession();if(!session)throw new Error('Please sign in again.');
   const {data,error}=await sb.functions.invoke('cc-ai-studio',{body:{prompt:brief,model:$('ccAiModel').value,size:$('ccAiSize').value,brand:{brand_name:brand.brand_name,primary_color:brand.primary_color,secondary_color:brand.secondary_color}}});
   if(error)throw error;if(!data||!data.image_base64)throw new Error(data?.error||'AI service returned no image.');
   const raw=atob(data.image_base64),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
   const blob=await composite(new Blob([bytes],{type:data.mime_type||'image/jpeg'}),brand,brief);
   if(!blob)throw new Error('Could not prepare PNG preview.');
   if(lastUrl)URL.revokeObjectURL(lastUrl);lastUrl=URL.createObjectURL(blob);
   $('ccAiPreview').className='';$('ccAiPreview').innerHTML='';const img=document.createElement('img');img.className='cc-ai-preview-img';img.alt='AI generated Campus Creatives design';img.src=lastUrl;$('ccAiPreview').appendChild(img);
   download.disabled=false;wait.textContent='Your artwork is ready. The saved client logo and contact details were composited where available.';status('Generated successfully. Download the PNG or describe a change to create another version.');
  }catch(e){wait.textContent='Generation could not start.';const msg=e?.message||String(e);status(msg.includes('POLLINATIONS_API_KEY')?'Provider key not configured yet. Add it as a Supabase Edge Function secret to enable generation.':msg);say('I could not generate the image: '+msg+' No image credits were spent by this failed request.')}
  finally{generate.disabled=false;generate.textContent='✦ Generate image'}
 }
 generate.addEventListener('click',run);
 promptEl.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();run()}});
 download.addEventListener('click',()=>{if(!lastUrl)return;const a=document.createElement('a');a.href=lastUrl;a.download='campus-creatives-ai-design.png';a.click()});
})();