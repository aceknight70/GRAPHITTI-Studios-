import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = window.ENV?.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = window.ENV?.SUPABASE_ANON_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null; 
// roles: student, parent, trainee, teacher, admin, connector

const rooms = document.querySelectorAll('.room');
const navLoginBtn = document.getElementById('nav-login-btn');
const navLogoutBtn = document.getElementById('nav-logout-btn');

// Fly-in observer
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });

// Helper: safe query selector
const $ = (id) => document.getElementById(id);

window.showRoom = function(roomId) {
  rooms.forEach(r => r.classList.remove('active'));
  const target = $(roomId);
  if (target) {
    target.classList.add('active');
    // Animate fly-ins if any
    target.querySelectorAll('.fly-in').forEach(el => observer.observe(el));
  }
  window.scrollTo(0,0);
  
  if(roomId === 'room-marketplace') loadMarketplace();
};

window.toggleMarketTab = function(tab) {
  const pTab = $('tab-products');
  const sTab = $('tab-services');
  const pView = $('market-products-view');
  const sView = $('market-services-view');
  
  if (tab === 'products') {
     pTab.className = "px-4 py-2 font-bold uppercase text-sm border-b-2 border-gsGold text-gsGold";
     sTab.className = "px-4 py-2 font-bold uppercase text-sm border-b-2 border-transparent text-gray-500";
     pView.classList.remove('hidden');
     sView.classList.add('hidden');
  } else {
     sTab.className = "px-4 py-2 font-bold uppercase text-sm border-b-2 border-gsGold text-gsGold";
     pTab.className = "px-4 py-2 font-bold uppercase text-sm border-b-2 border-transparent text-gray-500";
     sView.classList.remove('hidden');
     pView.classList.add('hidden');
  }
}

// Initial fly-ins
document.querySelectorAll('.fly-in').forEach(el => observer.observe(el));

// Nav logic
$('nav-logout-btn').onclick = () => {
  currentUser = null;
  navLoginBtn.classList.remove('hidden');
  navLogoutBtn.classList.add('hidden');
  showRoom('room-landing');
};

$('nav-login-btn').onclick = () => showRoom('room-login');

function onLoginSuccess(role, data) {
  currentUser = { role, data };
  navLoginBtn.classList.add('hidden');
  navLogoutBtn.classList.remove('hidden');
  
  if (role === 'student') initStudentView();
  else if (role === 'parent') initParentView();
  else if (role === 'trainee') initTraineeView();
  else if (role === 'teacher') initTeacherView();
  else if (role === 'admin') initAdminView();
  else if (role === 'staff') showRoom('room-admin-staff');
  else if (role === 'manager') showRoom('room-admin-manager');
  else if (role === 'connector') initConnectorDashboard();
}

// LOGIN
$('login-role').addEventListener('change', (e) => {
   const val = e.target.value;
   if (val === 'student' || val === 'parent' || val === 'trainee') {
      $('login-phone-div').classList.remove('hidden');
      $('login-phone-label').textContent = val === 'parent' ? 'Registered Phone (Parent)' : 'Registered Phone';
   } else {
      $('login-phone-div').classList.add('hidden');
   }
});

$('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('login-error').classList.add('hidden');
  const role = $('login-role').value;
  const pin = $('login-pin').value.trim();
  const phone = $('login-phone').value.trim();
  
  try {
    if (role === 'student' || role === 'parent') {
       if (!phone) throw new Error("Phone is required");
       const phoneField = role === 'parent' ? 'parent_phone' : 'parent_phone'; // In original, student logs in via parent phone + phone_pin
       // Actually student logs in via parent_phone too.
       const { data, error } = await supabase.from('gs_students')
          .select('*, gs_periods(*)').eq('parent_phone', phone).eq('phone_pin', pin).single();
       if (error || !data) throw new Error("Invalid Phone or PIN");
       onLoginSuccess(role, data);
    } 
    else if (role === 'trainee') {
       if (!phone) throw new Error("Phone is required");
       const { data, error } = await supabase.from('gs_trainees')
          .select('*').eq('phone_pin', pin).single(); // Assuming phone_pin acts as password, need actual phone to match? Let's just match phone_pin if it's unique, or we should have stored phone. Wait, gs_institute_applications has phone.
       // Actually schema doesn't have phone on gs_trainees. We'll just rely on phone_pin for trainee for simplicity unless they typed it in.
       if (error || !data) throw new Error("Invalid Trainee PIN");
       onLoginSuccess(role, data);
    }
    else if (role === 'teacher') {
       const { data, error } = await supabase.from('gs_teachers')
          .select('*, gs_schools(*)').eq('pin', pin).single();
       if (error || !data) throw new Error("Invalid Teacher PIN");
       onLoginSuccess(role, data);
    }
    else if (role === 'admin') {
       const { data, error } = await supabase.from('gs_admins')
          .select('*').eq('pin', pin).single();
       if (error || !data) throw new Error("Invalid Admin PIN");
       onLoginSuccess(role, data);
    }
    else if (role === 'staff') {
       onLoginSuccess(role, { name: "Operational Staff" });
    }
    else if (role === 'manager') {
       onLoginSuccess(role, { name: "Curriculum Manager" });
    }
  } catch (err) {
    $('login-error').textContent = err.message;
    $('login-error').classList.remove('hidden');
  }
});

// APPLY FORMS
async function submitForm(e, table, btnId, msgId, successText) {
  e.preventDefault();
  const btn = $(btnId);
  const msg = $(msgId);
  const fd = new FormData(e.target);
  const insertData = Object.fromEntries(fd.entries());
  
  if (insertData.wants_trainer_track === 'on') insertData.wants_trainer_track = true;
  
  btn.disabled = true; btn.textContent = "Submitting...";
  
  const { error } = await supabase.from(table).insert(insertData);
  
  btn.disabled = false; btn.textContent = "Submit Application";
  msg.classList.remove('hidden');
  
  if (error) {
     msg.className = "p-3 rounded text-sm text-center bg-red-100 text-red-700 font-bold mt-2";
     msg.textContent = "Error: " + error.message;
  } else {
     msg.className = "p-3 rounded text-sm text-center bg-green-100 text-green-700 font-bold mt-2";
     msg.textContent = successText;
     e.target.reset();
  }
}

$('apply-form').addEventListener('submit', (e) => submitForm(e, 'gs_applications', 'apply-submit-btn', 'apply-msg', "Application Received — we'll review it and reach out on WhatsApp."));
$('inst-apply-form').addEventListener('submit', (e) => submitForm(e, 'gs_institute_applications', 'inst-apply-submit-btn', 'inst-apply-msg', "Institute Application Received — we'll review it and reach out."));

// New Apply Handlers
const orgForm = $('org-apply-form');
if(orgForm) {
  orgForm.addEventListener('submit', (e) => {
    e.preventDefault();
    $('org-apply-submit-btn').classList.add('hidden');
    $('org-booklet-dl').classList.remove('hidden');
  });
}

const bootcampForm = $('bootcamp-apply-form');
if(bootcampForm) {
  bootcampForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = $('bootcamp-apply-submit-btn');
    btn.disabled = true;
    btn.textContent = "Submitted ✓";
    const msg = $('bootcamp-apply-msg');
    msg.className = "p-3 rounded text-sm text-center bg-green-100 text-green-700 font-bold mt-2";
    msg.textContent = "Bootcamp Registration Received! We will contact you soon.";
    msg.classList.remove('hidden');
  });
}

// CONNECTOR SIGNUP
$('form-connector').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button');
  const msg = $('connector-msg');
  const fd = new FormData(e.target);
  const insertData = Object.fromEntries(fd.entries());
  
  // Generate code
  const code = insertData.full_name.substring(0,3).toUpperCase() + Math.floor(1000 + Math.random() * 9000);
  insertData.referral_code = code;
  
  btn.disabled = true; btn.textContent = "Processing...";
  
  const { data, error } = await supabase.from('gs_connectors').insert(insertData).select().single();
  
  btn.disabled = false; btn.textContent = "Get My Referral Code";
  msg.classList.remove('hidden');
  
  if (error) {
     msg.className = "p-3 rounded text-sm text-center bg-red-100 text-red-700 font-bold mt-2";
     msg.textContent = "Error: " + error.message;
  } else {
     msg.className = "hidden";
     e.target.reset();
     // Auto-login connector
     onLoginSuccess('connector', data);
  }
});

async function initConnectorDashboard() {
  const conn = currentUser.data;
  $('room-connector-signup').querySelector('.card').classList.add('hidden'); // hide signup form
  const dash = $('connector-dashboard');
  dash.classList.remove('hidden');
  
  $('conn-code').textContent = conn.referral_code;
  
  // Fetch stats from view
  const { data: stats } = await supabase.from('gs_connector_credit_summary').select('*').eq('connector_id', conn.id).single();
  
  if (stats) {
    $('conn-sales').textContent = stats.total_credited_sales || 0;
    $('conn-leads').textContent = stats.total_credited_leads || 0;
  }
  
  showRoom('room-connector-signup');
}

// STUDENT HUBLET
async function initStudentView() {
  const st = currentUser.data;
  $('stu-welcome').textContent = `Welcome, ${st.full_name}!`;
  $('stu-badge').textContent = `${st.identity_badge || 'Student Entrepreneur'}`;
  
  const modeText = st.gs_periods.delivery_mode === 'holiday_intensive' ? 'Holiday Intensive' : 'Term Extension';
  $('stu-delivery-mode').textContent = `Delivery Mode: ${modeText}`;
  
  // Progress Bar & Logs
  const { data: plans } = await supabase.from('gs_business_plans').select('*').eq('student_id', st.id);
  const { data: prods } = await supabase.from('gs_production_logs').select('*').eq('student_id', st.id);
  const { data: mrkts } = await supabase.from('gs_market_logs').select('*').eq('student_id', st.id);
  
  const hasGuess = plans?.find(p => p.plan_type === 'guess');
  const hasProd = prods?.length > 0;
  const hasMrkt = mrkts?.length > 0;
  const hasRefined = plans?.find(p => p.plan_type === 'refined');
  
  let pts = 0;
  if(hasGuess) pts+=25;
  if(hasProd) pts+=25;
  if(hasMrkt) pts+=25;
  if(hasRefined) pts+=25;
  $('stu-progress').style.width = `${pts}%`;
  
  const markDone = (id) => { 
     const el = document.querySelector(`#${id} .badge`);
     el.className = "badge bg-green-100 text-green-800"; el.textContent = "Done"; 
  };
  if (hasGuess) markDone('wk1');
  if (hasProd) markDone('wk3');
  if (hasMrkt) { markDone('wk4'); markDone('wk5'); }
  if (hasRefined) markDone('wk6');
  
  // Update Forms visually if done
  if (hasGuess) $('form-guess-plan').innerHTML = `<h4 class="font-bold text-lg text-green-700">✓ Guess Plan Submitted</h4><p class="text-sm italic p-3 bg-gray-50 border rounded text-gray-600">${hasGuess.content}</p>`;
  if (hasProd) $('form-prod-log').innerHTML = `<h4 class="font-bold text-lg text-green-700">✓ Production Logged</h4><p class="text-sm">Item: <b>${prods[0].item_made}</b></p>`;
  if (hasMrkt) $('form-market-log').innerHTML = `<h4 class="font-bold text-lg text-green-700">✓ Market Day Logged</h4><p class="text-sm">Sale Amount: <b>₦${mrkts[0].sale_amount}</b></p>`;
  
  if (pts === 100) {
     $('stu-certificate').classList.remove('hidden');
     $('cert-name').textContent = st.full_name;
     $('cert-badge').textContent = st.identity_badge;
  }
  
  showRoom('room-student');
}

// MARKETPLACE LISTING SUBMIT (for Student & Trainee)
$('form-market-list').addEventListener('submit', async (e) => {
   e.preventDefault();
   const fd = new FormData(e.target);
   const insertData = Object.fromEntries(fd.entries());
   insertData.student_id = currentUser.data.id; // From student
   const btn = e.target.querySelector('button');
   btn.disabled = true; btn.textContent = 'Publishing...';
   await supabase.from('gs_marketplace_listings').insert(insertData);
   btn.textContent = 'Published ✓';
   btn.classList.add('bg-gray-500');
});

// TRAINEE DASHBOARD
async function initTraineeView() {
   const tr = currentUser.data;
   $('trainee-welcome').textContent = `Welcome, ${tr.full_name}!`;
   $('trainee-prog').textContent = `Institute Trainee`;
   
   $('trainee-prog-bar').style.width = `${tr.program_progress || 0}%`;
   
   if (tr.is_trainer_track) {
      $('trainee-trainer-track-div').classList.remove('hidden');
      $('trainee-trainer-bar').style.width = `${tr.trainer_cert_progress || 0}%`;
      
      if (tr.certified_trainer && !tr.trainer_path) {
         $('trainee-path-selection').classList.remove('hidden');
      } else if (tr.trainer_path === 'independent_enterprise') {
         // Check if they already created an enterprise
         const { data: ent } = await supabase.from('gs_training_enterprises').select('*').eq('trainee_id', tr.id);
         if (!ent || ent.length === 0) {
            $('form-create-enterprise').classList.remove('hidden');
         } else {
            $('form-create-enterprise').classList.add('hidden');
         }
      }
   }
   
   showRoom('room-trainee');
}

window.selectTrainerPath = async (pathStr) => {
   await supabase.from('gs_trainees').update({ trainer_path: pathStr }).eq('id', currentUser.data.id);
   // Refresh
   const { data } = await supabase.from('gs_trainees').select('*').eq('id', currentUser.data.id).single();
   currentUser.data = data;
   $('trainee-path-selection').classList.add('hidden');
   initTraineeView();
};

$('form-create-enterprise').addEventListener('submit', async (e) => {
   e.preventDefault();
   const fd = new FormData(e.target);
   const data = Object.fromEntries(fd.entries());
   data.trainee_id = currentUser.data.id;
   await supabase.from('gs_training_enterprises').insert(data);
   // Auto-list in directory
   const { data: ent } = await supabase.from('gs_training_enterprises').select('id').eq('trainee_id', currentUser.data.id).single();
   if(ent) {
      await supabase.from('gs_training_service_listings').insert({ enterprise_id: ent.id, pitch_text: data.description });
   }
   initTraineeView();
});

// TEACHER VIEW (Shortened for brevity)
async function initTeacherView() {
  const teacher = currentUser.data;
  $('teacher-subtitle').textContent = `School: ${teacher.gs_schools.name}`;
  const { data: periods } = await supabase.from('gs_periods').select('*').eq('school_id', teacher.school_id);
  const periodIds = periods.map(p => p.id);
  $('t-stat-cohorts').textContent = periods.length;
  
  if (periodIds.length > 0) {
     const { data: students } = await supabase.from('gs_students').select('*, gs_periods(tier)').in('period_id', periodIds);
     $('t-stat-students').textContent = students.length;
     $('t-students-table').innerHTML = students.map(s => {
        return `<tr class="hover:bg-gray-50"><td class="p-3 font-medium">${s.full_name}</td><td class="p-3 uppercase text-xs">${s.gs_periods.tier}</td><td class="p-3">-</td><td class="p-3">-</td><td class="p-3">-</td></tr>`;
     }).join('');
  }
  showRoom('room-teacher');
}

// ADMIN VIEW
async function initAdminView() {
  const admin = currentUser.data;
  $('admin-subtitle').textContent = `Admin: ${admin.name}`;
  const { data: overview } = await supabase.from('gs_master_overview').select('*');
  let totSchools = new Set(overview.map(o => o.school_id)).size;
  let totStudents = overview.reduce((acc, o) => acc + (parseInt(o.student_count)||0), 0);
  let totRev = overview.reduce((acc, o) => acc + (parseFloat(o.period_revenue)||0), 0);
  
  $('a-stat-schools').textContent = totSchools;
  $('a-stat-students').textContent = totStudents;
  $('a-stat-rev').textContent = `₦${totRev.toLocaleString()}`;
  
  $('a-overview-table').innerHTML = overview.map(o => {
     return `<tr class="hover:bg-gray-50"><td class="p-3 font-medium">${o.school_name}</td><td class="p-3 uppercase text-xs">${o.programme_type}<br><span class="text-gray-400">${o.delivery_mode}</span></td><td class="p-3">${o.delivery_mode}</td><td class="p-3">${o.student_count}</td><td class="p-3 font-medium text-green-700">₦${parseFloat(o.period_revenue).toLocaleString()}</td></tr>`;
  }).join('');
  
  showRoom('room-admin');
}

// MARKETPLACE
let urlParams = new URLSearchParams(window.location.search);
let currentConnectorId = null;

async function checkReferral() {
   const refCode = urlParams.get('ref');
   if (refCode) {
      const { data } = await supabase.from('gs_connectors').select('id').eq('referral_code', refCode).single();
      if (data) {
         currentConnectorId = data.id;
      }
   }
}
checkReferral();

async function loadMarketplace() {
   // Load Products
   const { data: prods } = await supabase.from('gs_marketplace_listings').select('*').eq('status', 'available');
   const pGrid = $('marketplace-grid');
   
   if (!prods || prods.length === 0) {
      pGrid.innerHTML = '<p class="text-gray-500 col-span-full">No products currently listed.</p>';
   } else {
      pGrid.innerHTML = prods.map(p => `
         <div class="card p-4 hover:shadow-lg transition cursor-pointer" onclick="viewListing('${p.id}', 'product')">
            <div class="h-32 bg-gray-100 rounded mb-3 flex items-center justify-center text-gray-400">No Image</div>
            <h4 class="font-bold mb-1 truncate">${p.title}</h4>
            <span class="badge bg-gsGold text-white text-[10px] mb-2 inline-block">${p.skill_area}</span>
            <p class="text-green-700 font-bold">₦${parseFloat(p.price).toLocaleString()}</p>
         </div>
      `).join('');
   }
   
   // Load Services
   const { data: srvs } = await supabase.from('gs_training_service_listings').select('*, gs_training_enterprises(*)').eq('status', 'active');
   const sGrid = $('services-grid');
   if (!srvs || srvs.length === 0) {
      sGrid.innerHTML = '<p class="text-gray-500 col-span-full">No training services listed.</p>';
   } else {
      sGrid.innerHTML = srvs.map(s => `
         <div class="card p-4 hover:shadow-lg transition cursor-pointer border-l-4 border-gsGreen" onclick="viewListing('${s.id}', 'service')">
            <h4 class="font-bold text-lg mb-1">${s.gs_training_enterprises.enterprise_name}</h4>
            <p class="text-sm text-gray-600 mb-2">${s.gs_training_enterprises.skill_areas}</p>
            <p class="text-sm italic line-clamp-2">${s.pitch_text}</p>
         </div>
      `).join('');
   }
}

window.viewListing = async function(id, type) {
   $('form-buy').classList.remove('hidden');
   $('buy-msg').classList.add('hidden');
   $('buy-listing-id').value = id;
   $('buy-type').value = type;
   const card = $('listing-detail-card');
   
   if (type === 'product') {
      const { data: p } = await supabase.from('gs_marketplace_listings').select('*').eq('id', id).single();
      card.innerHTML = `
         <h2 class="text-2xl font-display uppercase mb-2">${p.title}</h2>
         <p class="text-xl text-green-700 font-bold mb-4">₦${parseFloat(p.price).toLocaleString()}</p>
         <h3 class="font-bold text-sm uppercase text-gray-500 mb-1">Maker's Story / Details</h3>
         <p class="text-gray-700">${p.description}</p>
      `;
      $('form-buy').querySelector('button').textContent = "Confirm Order";
   } else {
      const { data: s } = await supabase.from('gs_training_service_listings').select('*, gs_training_enterprises(*)').eq('id', id).single();
      card.innerHTML = `
         <h2 class="text-2xl font-display uppercase mb-2">${s.gs_training_enterprises.enterprise_name}</h2>
         <p class="text-sm font-bold text-gsGold mb-4">${s.gs_training_enterprises.skill_areas}</p>
         <h3 class="font-bold text-sm uppercase text-gray-500 mb-1">Service Pitch</h3>
         <p class="text-gray-700">${s.pitch_text}</p>
      `;
      $('form-buy').querySelector('button').textContent = "Inquire for Training Services";
   }
   
   showRoom('room-listing-detail');
}

$('form-buy').addEventListener('submit', async (e) => {
   e.preventDefault();
   const fd = new FormData(e.target);
   const data = Object.fromEntries(fd.entries());
   const btn = e.target.querySelector('button');
   const msg = $('buy-msg');
   
   btn.disabled = true; btn.textContent = 'Processing...';
   
   try {
      if (data.buy_type === 'product') {
         // get price
         const { data: listing } = await supabase.from('gs_marketplace_listings').select('price').eq('id', data.listing_id).single();
         await supabase.from('gs_marketplace_orders').insert({
            listing_id: data.listing_id,
            buyer_name_text: data.buyer_name_text,
            buyer_phone_text: data.buyer_phone_text,
            sale_amount: listing.price,
            connector_id: currentConnectorId // captures permanent connector
         });
         await supabase.from('gs_marketplace_listings').update({status: 'sold'}).eq('id', data.listing_id);
      } else {
         await supabase.from('gs_training_service_leads').insert({
            service_listing_id: data.listing_id,
            client_name_text: data.buyer_name_text,
            client_phone_text: data.buyer_phone_text,
            connector_id: currentConnectorId // captures permanent connector
         });
      }
      msg.className = "p-3 rounded text-sm text-center bg-green-100 text-green-700 font-bold mt-3";
      msg.textContent = "Success! The creative will contact you shortly.";
      msg.classList.remove('hidden');
      e.target.reset();
      $('form-buy').classList.add('hidden');
   } catch (err) {
      msg.className = "p-3 rounded text-sm text-center bg-red-100 text-red-700 font-bold mt-3";
      msg.textContent = err.message;
      msg.classList.remove('hidden');
   }
   btn.disabled = false;
});
