/* Campus Creatives agency upgrade modules — independent of AI Designer */
(()=>{
 const $=id=>document.getElementById(id);
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const inr=n=>'₹'+Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:2});
 const note=(id,t)=>{if($(id))$(id).textContent=t};
 const formValues=f=>Object.fromEntries(new FormData(f));
 async function fillClientSelects(){
  const {data,error}=await sb.from('clients').select('id,name,institution').order('name');
  if(error){note('ccClientLinkMsg',error.message);return}
  ['ccPortalClient','ccSocialClient','ccCampaignClient','ccProjectClient','ccInvoiceClient','ccApprovalClient'].forEach(id=>{const el=$(id);if(!el)return;const empty=el.options[0]?.outerHTML||'<option value="">Select client</option>';el.innerHTML=empty+(data||[]).map(c=>'<option value="'+c.id+'">'+esc(c.name)+(c.institution?' · '+esc(c.institution):'')+'</option>').join('')});
 }
 async function loadLinks(){
  await fillClientSelects();
  const {data,error}=await sb.from('cc_client_users').select('id,client_id,user_id,email,is_active,created_at,clients(name)').order('created_at',{ascending:false});
  if(error){$('ccClientLinksTable').textContent=error.message;return}
  $('ccClientLinksTable').innerHTML=(data||[]).length?'<table><thead><tr><th>Client</th><th>Login email</th><th>Auth user ID</th><th>Access</th><th></th></tr></thead><tbody>'+(data||[]).map(x=>'<tr><td><b>'+esc(x.clients?.name||'Client')+'</b></td><td>'+esc(x.email||'—')+'</td><td><small>'+esc(x.user_id)+'</small></td><td><span class="pill">'+(x.is_active?'Active':'Disabled')+'</span></td><td><button class="btn light small" data-link-toggle="'+x.id+'" data-active="'+x.is_active+'">'+(x.is_active?'Disable':'Enable')+'</button> <button class="btn danger small" data-link-delete="'+x.id+'">Remove</button></td></tr>').join('')+'</tbody></table>':'<div class="empty">No client logins linked yet.</div>';
  document.querySelectorAll('[data-link-toggle]').forEach(b=>b.onclick=async()=>{const {error}=await sb.from('cc_client_users').update({is_active:b.dataset.active!=='true'}).eq('id',b.dataset.linkToggle);if(error)alert(error.message);else loadLinks()});
  document.querySelectorAll('[data-link-delete]').forEach(b=>b.onclick=async()=>{if(!confirm('Remove this client portal link?'))return;const {error}=await sb.from('cc_client_users').delete().eq('id',b.dataset.linkDelete);if(error)alert(error.message);else loadLinks()});
 }
 async function loadSocial(){
  await fillClientSelects();
  const {data,error}=await sb.from('cc_social_posts').select('*,clients(name)').order('scheduled_at',{ascending:true,nullsFirst:false});
  if(error){$('ccSocialTable').textContent=error.message;return}
  const rows=data||[];$('ccSocialTotal').textContent=rows.length;$('ccSocialApproval').textContent=rows.filter(x=>x.status==='Needs Approval').length;$('ccSocialScheduled').textContent=rows.filter(x=>x.status==='Scheduled').length;$('ccSocialPublished').textContent=rows.filter(x=>x.status==='Published').length;
  $('ccSocialTable').innerHTML=rows.length?'<table><thead><tr><th>Content</th><th>Platform</th><th>Client</th><th>Schedule</th><th>Status</th><th>Actions</th></tr></thead><tbody>'+rows.map(x=>'<tr><td><b>'+esc(x.title)+'</b><br><small>'+esc(x.format)+' · '+esc(x.caption||'')+'</small></td><td>'+esc(x.platform)+'</td><td>'+esc(x.clients?.name||'Internal')+'</td><td>'+ (x.scheduled_at?new Date(x.scheduled_at).toLocaleString('en-IN'):'Not scheduled')+'</td><td><select class="statusSel" data-social-status="'+x.id+'">'+['Draft','Needs Approval','Approved','Scheduled','Published','Cancelled'].map(v=>'<option '+(v===x.status?'selected':'')+'>'+v+'</option>').join('')+'</select></td><td><button class="btn danger small" data-social-del="'+x.id+'">Delete</button></td></tr>').join('')+'</tbody></table>':'<div class="empty">No content planned. Create your first post above.</div>';
  document.querySelectorAll('[data-social-status]').forEach(el=>el.onchange=async()=>{const {error}=await sb.from('cc_social_posts').update({status:el.value}).eq('id',el.dataset.socialStatus);if(error)alert(error.message);else loadSocial()});
  document.querySelectorAll('[data-social-del]').forEach(b=>b.onclick=async()=>{if(!confirm('Delete this content plan?'))return;const {error}=await sb.from('cc_social_posts').delete().eq('id',b.dataset.socialDel);if(error)alert(error.message);else loadSocial()});
 }
 async function loadCampaigns(){
  await fillClientSelects();
  const {data,error}=await sb.from('cc_campaigns').select('*,clients(name)').order('created_at',{ascending:false});
  if(error){$('ccCampaignTable').textContent=error.message;return}
  const rows=data||[],sum=k=>rows.reduce((a,x)=>a+Number(x[k]||0),0);
  $('ccCampBudget').textContent=inr(sum('budget'));$('ccCampSpend').textContent=inr(sum('spend'));$('ccCampLeads').textContent=sum('leads');$('ccCampRevenue').textContent=inr(sum('attributed_revenue'));
  $('ccCampaignTable').innerHTML=rows.length?'<table><thead><tr><th>Campaign</th><th>Channel</th><th>Client</th><th>Spend</th><th>Leads</th><th>Conversions</th><th>Cost / Lead</th><th>ROAS</th><th>Status</th><th></th></tr></thead><tbody>'+rows.map(x=>'<tr><td><b>'+esc(x.name)+'</b><br><small>'+esc(x.objective||'')+'</small></td><td>'+esc(x.channel)+'</td><td>'+esc(x.clients?.name||'Internal')+'</td><td>'+inr(x.spend)+'</td><td>'+Number(x.leads||0)+'</td><td>'+Number(x.conversions||0)+'</td><td>'+inr(x.leads?Number(x.spend)/x.leads:0)+'</td><td>'+(Number(x.spend)>0?(Number(x.attributed_revenue)/Number(x.spend)).toFixed(2)+'x':'—')+'</td><td><select class="statusSel" data-camp-status="'+x.id+'">'+['Planning','Active','Paused','Completed'].map(v=>'<option '+(v===x.status?'selected':'')+'>'+v+'</option>').join('')+'</select></td><td><button class="btn danger small" data-camp-del="'+x.id+'">Delete</button></td></tr>').join('')+'</tbody></table>':'<div class="empty">No campaigns recorded yet.</div>';
  document.querySelectorAll('[data-camp-status]').forEach(el=>el.onchange=async()=>{const {error}=await sb.from('cc_campaigns').update({status:el.value}).eq('id',el.dataset.campStatus);if(error)alert(error.message);else loadCampaigns()});
  document.querySelectorAll('[data-camp-del]').forEach(b=>b.onclick=async()=>{if(!confirm('Delete this campaign? Linked posts will remain but lose campaign association.'))return;const {error}=await sb.from('cc_campaigns').delete().eq('id',b.dataset.campDel);if(error)alert(error.message);else loadCampaigns()});
 }
 async function loadPerformance(){
  const [tr,mr]=await Promise.all([sb.from('admin_tasks').select('id,status,due_date,assigned_member_id'),sb.from('cc_team_members').select('id,full_name,role,status').order('full_name')]);
  const err=tr.error||mr.error;if(err){$('ccPerformanceTable').textContent=err.message;return}
  const tasks=tr.data||[],members=mr.data||[],done=tasks.filter(t=>t.status==='Done').length,today=new Date().toISOString().slice(0,10),overdue=tasks.filter(t=>t.status!=='Done'&&t.due_date&&t.due_date<today).length;
  $('ccPerfTasks').textContent=tasks.length;$('ccPerfDone').textContent=done;$('ccPerfOverdue').textContent=overdue;$('ccPerfRate').textContent=(tasks.length?Math.round(done/tasks.length*100):0)+'%';
  $('ccPerformanceTable').innerHTML=members.length?'<table><thead><tr><th>Team member</th><th>Role</th><th>Assigned</th><th>Completed</th><th>Open</th><th>Overdue</th><th>Completion</th></tr></thead><tbody>'+members.map(m=>{const a=tasks.filter(t=>t.assigned_member_id===m.id),d=a.filter(t=>t.status==='Done').length,o=a.filter(t=>t.status!=='Done'&&t.due_date&&t.due_date<today).length;return '<tr><td><b>'+esc(m.full_name)+'</b></td><td>'+esc(m.role)+'</td><td>'+a.length+'</td><td>'+d+'</td><td>'+(a.length-d)+'</td><td>'+o+'</td><td>'+(a.length?Math.round(d/a.length*100):0)+'%</td></tr>'}).join('')+'</tbody></table>':'<div class="empty">Add team members and assign tasks to see workload.</div>';
 }
 $('ccClientLinkForm')?.addEventListener('submit',async e=>{e.preventDefault();const v=formValues(e.target);v.is_active=v.is_active==='true';if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v.user_id)){note('ccClientLinkMsg','Enter a valid Supabase Auth user UUID.');return}const {error}=await sb.from('cc_client_users').upsert(v,{onConflict:'user_id'});if(error){note('ccClientLinkMsg',error.message);return}e.target.reset();note('ccClientLinkMsg','Client portal access linked.');loadLinks()});
 $('ccSocialForm')?.addEventListener('submit',async e=>{e.preventDefault();const v=formValues(e.target);['client_id','scheduled_at','asset_url','caption','hashtags','published_url'].forEach(k=>{if(!v[k])v[k]=null});if(v.scheduled_at)v.scheduled_at=new Date(v.scheduled_at).toISOString();const {error}=await sb.from('cc_social_posts').insert(v);if(error){note('ccSocialMsg',error.message);return}e.target.reset();note('ccSocialMsg','Content plan saved.');loadSocial()});
 $('ccCampaignForm')?.addEventListener('submit',async e=>{e.preventDefault();const v=formValues(e.target);['budget','spend','leads','conversions','attributed_revenue'].forEach(k=>v[k]=Number(v[k]||0));['client_id','objective','start_date','end_date','notes'].forEach(k=>{if(!v[k])v[k]=null});const {error}=await sb.from('cc_campaigns').insert(v);if(error){note('ccCampaignMsg',error.message);return}e.target.reset();note('ccCampaignMsg','Campaign saved.');loadCampaigns()});
 $('ccRefreshLinks')?.addEventListener('click',loadLinks);$('ccRefreshSocial')?.addEventListener('click',loadSocial);$('ccRefreshCampaigns')?.addEventListener('click',loadCampaigns);$('ccRefreshPerformance')?.addEventListener('click',loadPerformance);
 document.querySelectorAll('.navbtn[data-page]').forEach(b=>b.addEventListener('click',()=>{const p=b.dataset.page;if(p==='clientportal')loadLinks();if(p==='social')loadSocial();if(p==='campaigns')loadCampaigns();if(p==='performance')loadPerformance()}));
})();
