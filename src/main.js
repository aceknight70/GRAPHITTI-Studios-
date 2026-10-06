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
  if(roomId === 'room-about') renderAboutRoom();
  if(roomId === 'room-how-it-works') renderHowItWorksRoom();
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
  updateLogoVisibility();
  renderAboutRoom();
  renderHowItWorksRoom();
  showRoom('room-landing');
};

$('nav-login-btn').onclick = () => {
  $('modal-login').classList.remove('hidden');
};

window.closeLoginModal = function() {
  $('modal-login').classList.add('hidden');
};

function onLoginSuccess(role, data) {
  window.closeLoginModal();
  currentUser = { role, data };
  navLoginBtn.classList.add('hidden');
  navLogoutBtn.classList.remove('hidden');
  updateLogoVisibility();
  renderAboutRoom();
  renderHowItWorksRoom();
  
  if (role === 'student') initStudentView();
  else if (role === 'parent') initParentView();
  else if (role === 'trainee') initTraineeView();
  else if (role === 'teacher') initTeacherView();
  else if (role === 'admin' || role === 'master') {
    const activeRoom = document.querySelector('.room.active');
    if (activeRoom && (activeRoom.id === 'room-about' || activeRoom.id === 'room-how-it-works')) {
      showAboutToast('👑 Master Admin privileges activated. Click ✏️ on any block to edit in-place!');
    } else {
      initAdminView();
    }
  }
  else if (role === 'manager') {
    const activeRoom = document.querySelector('.room.active');
    if (activeRoom && (activeRoom.id === 'room-about' || activeRoom.id === 'room-how-it-works')) {
      showAboutToast('👑 Manager privileges activated (Barbara). Click ✏️ on any block to edit in-place!');
    } else {
      showRoom('room-admin-manager');
    }
  }
  else if (role === 'staff') showRoom('room-admin-staff');
  else if (role === 'connector') initConnectorDashboard();
}

// LOGIN
$('login-role').addEventListener('change', (e) => {
   const val = e.target.value;
   const hintEl = $('login-pin-hint');
   if (val === 'student' || val === 'parent' || val === 'trainee') {
      $('login-phone-div').classList.remove('hidden');
      $('login-phone-label').textContent = val === 'parent' ? 'Registered Phone (Parent)' : 'Registered Phone';
      if (hintEl) hintEl.textContent = 'Enter your registered phone and phone PIN.';
   } else {
      $('login-phone-div').classList.add('hidden');
      if (hintEl) {
        if (val === 'admin') {
          hintEl.innerHTML = 'Master Admin PIN: <span class="font-mono font-bold text-gsBrown">1234</span> (App Owner & Fortune).';
        } else if (val === 'manager') {
          hintEl.innerHTML = 'Manager PIN: <span class="font-mono font-bold text-gsBrown">4321</span> (Barbara Abieyuwa Omoregie).';
        } else if (val === 'staff') {
          hintEl.innerHTML = 'Staff PIN: <span class="font-mono font-bold text-gsBrown">5555</span> (Operations Dashboard).';
        } else if (val === 'teacher') {
          hintEl.textContent = 'Enter your assigned teacher PIN.';
        } else {
          hintEl.textContent = 'Enter your PIN to access the operational portal.';
        }
      }
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
       const phoneField = role === 'parent' ? 'parent_phone' : 'parent_phone';
       const { data, error } = await supabase.from('gs_students')
          .select('*, gs_periods(*)').eq('parent_phone', phone).eq('phone_pin', pin).single();
       if (error || !data) throw new Error("Invalid Phone or PIN");
       onLoginSuccess(role, data);
    } 
    else if (role === 'trainee') {
       if (!phone) throw new Error("Phone is required");
       const { data, error } = await supabase.from('gs_trainees')
          .select('*').eq('phone_pin', pin).single();
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
       // Master Admin (App Owner & Fortune) - ONE consistent PIN: 1234
       let adminUser = null;
       try {
         const { data, error } = await supabase.from('gs_admins')
            .select('*').eq('pin', pin).single();
         if (!error && data) {
           adminUser = data;
         }
       } catch (err) {
         console.warn('gs_admins lookup note:', err);
       }

       // ONE consistent Master Admin PIN: 1234
       if (!adminUser && pin === '1234') {
         adminUser = {
           id: 'master-owner-01',
           name: 'App Master (Owner & Fortune)',
           role: 'master',
           is_master: true,
           title: 'App Master & Owner'
         };
       }

       if (!adminUser) throw new Error("Invalid Master Admin PIN. The Master Admin PIN is 1234.");
       onLoginSuccess('admin', adminUser);
    }
    else if (role === 'manager') {
       // Manager (Barbara Abieyuwa Omoregie) - PIN: 4321
       let managerUser = null;
       try {
         const { data, error } = await supabase.from('gs_admins')
            .select('*').eq('pin', pin).single();
         if (!error && data) {
           managerUser = data;
         }
       } catch (err) {
         console.warn('gs_admins lookup note:', err);
       }

       if (!managerUser && pin === '4321') {
         managerUser = {
           id: 'manager-barbara-01',
           name: 'Barbara Abieyuwa Omoregie',
           role: 'manager',
           is_manager: true,
           title: 'Creative Director & Manager'
         };
       }

       if (!managerUser) throw new Error("Invalid Manager PIN. The Manager PIN is 4321.");
       onLoginSuccess('manager', managerUser);
    }
    else if (role === 'staff') {
       // Staff PIN: 5555
       let staffUser = null;
       try {
         const { data, error } = await supabase.from('gs_admins')
            .select('*').eq('pin', pin).eq('role', 'staff').single();
         if (!error && data) staffUser = data;
       } catch (err) {}

       if (!staffUser && pin === '5555') {
         staffUser = { id: 'staff-01', name: "Operational Staff", role: 'staff' };
       }

       if (!staffUser) throw new Error("Invalid Staff PIN. The Staff PIN is 5555.");
       onLoginSuccess('staff', staffUser);
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

// ==========================================
// ABOUT GRAPHITTI STUDIOS — DYNAMIC & INLINE EDITING MODULE
// ==========================================

function isAppMaster() {
  if (!currentUser) return false;
  const r = currentUser.role || currentUser.data?.role;
  return r === 'master' || r === 'admin' || currentUser.data?.is_master === true;
}

function isManager() {
  if (!currentUser) return false;
  const r = currentUser.role || currentUser.data?.role;
  return r === 'manager' || currentUser.data?.is_manager === true;
}

function isMasterOrManager() {
  return isAppMaster() || isManager();
}

let aboutContentMap = {
  description: `Graphitti Studios is a premier Creative Entrepreneurship Incubator dedicated to bridging the gap between creative passion and market reality. We equip individuals and institutions with the production mechanics and business acumen required to thrive in the modern economy.

From school-packaged SDG'preneurship tracks to full commercial production depth, our mission is to turn raw creative talent into sustainable, scalable, and impact-driven commercial enterprises.

Our comprehensive incubator spans specialized tracks in Resin Jewelry & Accessories, Leather Works & Bag Making, Fashion Design, Culinary Arts, Film & Theatre Arts, and Digital Media Creation.`,
  background: `With over 8 years of proven excellence across Nigeria, Graphitti Studios has established deep roots in the nation's creative and vocational education ecosystem.

We work in close synergy with top tertiary institutions (including University of Benin, Auchi Polytechnic, and federal colleges of education), the National Youth Service Corps (NYSC) through Skill Acquisition and Entrepreneurship Development (SAED), state SDG offices, and the Nigerian film industry (Nollywood).

Our journey has empowered thousands of youths, corps members, and students to build self-sustaining creative enterprises that address local economic needs while championing sustainable production practices.`,
  team_intro: `Meet the creative directors, master craftspeople, and visionary institutional partners powering Graphitti Studios.`,
  address: `Graphitti Studios Headquarters:
Blk 6 Iye Plaza, Refinery Road, Effurun, Delta State, Nigeria

Regional Training & Incubation Hubs:
• Festac Town, Lagos State
• GRA, Benin City, Edo State

Phone: (+234) 08030796898
Email: barbara06sfx@gmail.com`
};

let teamMembersList = [
  {
    id: 'seed-1',
    name: 'Barbara Abieyuwa Omoregie',
    role: 'Creative Director & Founder',
    bio: 'Visionary creative entrepreneur, educator, and master craftsman leading Graphitti Studios with over 8 years of hands-on expertise in design, curriculum development, and enterprise incubation.',
    photo_url: '/Screenshot_20260908_102638_WhatsApp.jpg',
    is_partner: false,
    display_order: 0
  },
  {
    id: 'seed-2',
    name: 'ESGMC',
    role: 'Strategic Education & Enterprise Partner',
    bio: 'Pioneering educational services and institutional partner supporting curriculum standardization, school outreach, and creative venture certification across Nigeria.',
    photo_url: '',
    is_partner: true,
    display_order: 1
  },
  {
    id: 'seed-3',
    name: 'Smart ICT',
    role: 'Technology & Digital Innovation Partner',
    bio: 'Advanced technological training center powering digital creative tracks, media workstations, and hybrid modern entrepreneurial learning.',
    photo_url: '',
    is_partner: true,
    display_order: 2
  }
];

let editingSections = {
  description: false,
  background: false,
  address: false,
  team_intro: false
};
let editingMembers = {};
let isAddingMember = false;

function showAboutToast(message, isSuccess = true) {
  const toast = $('about-toast');
  const text = $('about-toast-text');
  const icon = $('about-toast-icon');
  if (!toast || !text) return;
  text.textContent = message;
  if (icon) icon.textContent = isSuccess ? '✨' : '⚠️';
  toast.classList.remove('hidden');
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3500);
}

async function loadAboutContent() {
  // 1. Fetch gs_about_content
  try {
    const { data, error } = await supabase.from('gs_about_content').select('*');
    if (!error && data && data.length > 0) {
      data.forEach(item => {
        if (item.section_key && item.content_text) {
          aboutContentMap[item.section_key] = item.content_text;
          if (item.section_key === 'logo_url') {
            applyLogoToHeader(item.content_text);
          }
        }
      });
    } else {
      ['description', 'background', 'address', 'team_intro'].forEach(k => {
        const saved = localStorage.getItem('gs_about_' + k);
        if (saved) aboutContentMap[k] = saved;
      });
    }
  } catch (e) {
    ['description', 'background', 'address', 'team_intro'].forEach(k => {
      const saved = localStorage.getItem('gs_about_' + k);
      if (saved) aboutContentMap[k] = saved;
    });
  }

  // 2. Fetch gs_team_members
  try {
    const { data, error } = await supabase
      .from('gs_team_members')
      .select('*')
      .order('display_order', { ascending: true });
    if (!error && data && data.length > 0) {
      teamMembersList = data;
    } else {
      const saved = localStorage.getItem('gs_team_members_local');
      if (saved) {
        try { teamMembersList = JSON.parse(saved); } catch(err) {}
      }
    }
  } catch (e) {
    const saved = localStorage.getItem('gs_team_members_local');
    if (saved) {
      try { teamMembersList = JSON.parse(saved); } catch(err) {}
    }
  }

  renderAboutRoom();
}

function escapeAboutHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderAboutRoom() {
  const canEdit = isMasterOrManager();
  const masterAdmin = isAppMaster();

  // Master Admin / Manager top banner
  const banner = $('about-master-banner');
  const roleBadgeText = $('about-role-badge-text');
  if (banner) {
    if (canEdit) {
      banner.classList.remove('hidden');
      if (roleBadgeText) {
        roleBadgeText.textContent = masterAdmin
          ? 'Master Admin Editorial Privileges Active (Owner & Fortune)'
          : 'Manager Editorial Privileges Active (Barbara Abieyuwa Omoregie)';
      }
    } else {
      banner.classList.add('hidden');
    }
  }

  // --- 1. DESCRIPTION SECTION ---
  const descCard = $('about-desc-card');
  if (descCard) {
    if (editingSections.description && canEdit) {
      descCard.innerHTML = `
        <div class="space-y-4">
          <div class="flex items-center justify-between border-b pb-2 border-orange-200">
            <h3 class="font-display uppercase text-lg text-gsBrown flex items-center gap-2">
              <span>🖐️</span> Editing Description (${masterAdmin ? 'Master Admin' : 'Manager'} In-Place)
            </h3>
            <span class="badge bg-amber-100 text-gsBrown text-xs">Editing Mode</span>
          </div>
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">Tagline & Overview Paragraphs</label>
            <textarea id="edit-textarea-description" class="input-field h-52 font-sans text-sm leading-relaxed border-2 border-gsGold/60 bg-amber-50/20 shadow-inner">${escapeAboutHtml(aboutContentMap.description)}</textarea>
            <p class="text-[11px] text-gray-500 mt-1">Separate distinct paragraphs with a blank line.</p>
          </div>
          <div class="flex items-center justify-end gap-3 pt-2 border-t">
            <button type="button" onclick="window.cancelEditSection('description')" class="px-4 py-2 border border-gray-300 text-gray-700 rounded text-xs font-bold uppercase tracking-wider hover:bg-gray-100 transition">Cancel</button>
            <button type="button" onclick="window.saveSection('description')" class="btn-primary text-xs py-2 px-5 shadow">Save Changes</button>
          </div>
        </div>
      `;
    } else {
      const paras = (aboutContentMap.description || '').split(/\n\s*\n/).filter(p => p.trim().length > 0);
      const editBtn = canEdit ? `
        <button onclick="window.startEditSection('description')" class="absolute top-4 right-4 p-2 rounded-full bg-white shadow-md border border-orange-200 text-gsBrown hover:bg-gsGold hover:text-white transition flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider" title="Edit Description in-place">
          <span>✏️</span> <span class="hidden sm:inline">Edit</span>
        </button>
      ` : '';

      descCard.innerHTML = `
        ${editBtn}
        <div class="pr-10">
          <div class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gsGold mb-2">
            <span>🎨</span> Section 1: Overview & Mission
          </div>
          <h3 class="text-2xl md:text-3xl font-display uppercase tracking-tight text-gsBrown mb-4">Empowering Creative Enterprise</h3>
          <div class="space-y-3 text-gray-700 leading-relaxed text-base">
            ${paras.map((p, idx) => {
              if (idx === 0) {
                return `<p class="text-lg font-medium text-gray-900 leading-relaxed border-l-4 border-gsGold pl-4 bg-orange-50/40 py-2 rounded-r">${escapeAboutHtml(p)}</p>`;
              }
              return `<p>${escapeAboutHtml(p)}</p>`;
            }).join('')}
          </div>
        </div>
      `;
    }
  }

  // --- 2. BACKGROUND SECTION ---
  const bgCard = $('about-bg-card');
  if (bgCard) {
    if (editingSections.background && canEdit) {
      bgCard.innerHTML = `
        <div class="space-y-4">
          <div class="flex items-center justify-between border-b pb-2 border-orange-200">
            <h3 class="font-display uppercase text-lg text-gsBrown flex items-center gap-2">
              <span>📜</span> Editing Background & Heritage (${masterAdmin ? 'Master Admin' : 'Manager'} In-Place)
            </h3>
            <span class="badge bg-amber-100 text-gsBrown text-xs">Editing Mode</span>
          </div>
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">Studio History & Institutional Track Record</label>
            <textarea id="edit-textarea-background" class="input-field h-52 font-sans text-sm leading-relaxed border-2 border-gsBrown/60 bg-amber-50/20 shadow-inner">${escapeAboutHtml(aboutContentMap.background)}</textarea>
            <p class="text-[11px] text-gray-500 mt-1">Separate distinct paragraphs with a blank line.</p>
          </div>
          <div class="flex items-center justify-end gap-3 pt-2 border-t">
            <button type="button" onclick="window.cancelEditSection('background')" class="px-4 py-2 border border-gray-300 text-gray-700 rounded text-xs font-bold uppercase tracking-wider hover:bg-gray-100 transition">Cancel</button>
            <button type="button" onclick="window.saveSection('background')" class="btn-primary text-xs py-2 px-5 shadow">Save Changes</button>
          </div>
        </div>
      `;
    } else {
      const paras = (aboutContentMap.background || '').split(/\n\s*\n/).filter(p => p.trim().length > 0);
      const editBtn = canEdit ? `
        <button onclick="window.startEditSection('background')" class="absolute top-4 right-4 p-2 rounded-full bg-white shadow-md border border-orange-200 text-gsBrown hover:bg-gsGold hover:text-white transition flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider" title="Edit Background in-place">
          <span>✏️</span> <span class="hidden sm:inline">Edit</span>
        </button>
      ` : '';

      bgCard.innerHTML = `
        ${editBtn}
        <div class="pr-10">
          <div class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gsBrown mb-2">
            <span>🏛️</span> Section 2: Studio Background & Heritage
          </div>
          <h3 class="text-2xl md:text-3xl font-display uppercase tracking-tight text-gray-900 mb-3">8+ Years of Proven Excellence</h3>
          
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
            <div class="p-3.5 bg-orange-50/80 rounded-lg border border-orange-100 text-center">
              <span class="block text-2xl font-display text-gsGold">8+ Years</span>
              <span class="text-[11px] font-bold uppercase text-gray-600">Track Record</span>
            </div>
            <div class="p-3.5 bg-orange-50/80 rounded-lg border border-orange-100 text-center">
              <span class="block text-2xl font-display text-gsBrown">Tertiary</span>
              <span class="text-[11px] font-bold uppercase text-gray-600">University Hubs</span>
            </div>
            <div class="p-3.5 bg-orange-50/80 rounded-lg border border-orange-100 text-center">
              <span class="block text-2xl font-display text-gsRed">NYSC SAED</span>
              <span class="text-[11px] font-bold uppercase text-gray-600">Corps Training</span>
            </div>
            <div class="p-3.5 bg-orange-50/80 rounded-lg border border-orange-100 text-center">
              <span class="block text-2xl font-display text-gsGreen">Nollywood</span>
              <span class="text-[11px] font-bold uppercase text-gray-600">Film & Creative</span>
            </div>
          </div>

          <div class="space-y-3 text-gray-700 leading-relaxed text-base">
            ${paras.map(p => `<p>${escapeAboutHtml(p)}</p>`).join('')}
          </div>
        </div>
      `;
    }
  }

  // --- 3. TEAM INTRO & GRID ---
  const teamIntroDisplay = $('about-team-intro-display');
  const teamIntroAction = $('about-team-intro-action');
  if (teamIntroDisplay) {
    if (editingSections.team_intro && canEdit) {
      teamIntroDisplay.innerHTML = `
        <div class="mt-2 space-y-2 max-w-xl">
          <input type="text" id="edit-textarea-team_intro" class="input-field text-sm font-medium" value="${escapeAboutHtml(aboutContentMap.team_intro)}" />
          <div class="flex gap-2">
            <button type="button" onclick="window.saveSection('team_intro')" class="btn-primary text-[11px] py-1 px-3">Save</button>
            <button type="button" onclick="window.cancelEditSection('team_intro')" class="px-3 py-1 border rounded text-[11px] text-gray-600 hover:bg-gray-100">Cancel</button>
          </div>
        </div>
      `;
      if (teamIntroAction) teamIntroAction.innerHTML = '';
    } else {
      teamIntroDisplay.textContent = aboutContentMap.team_intro;
      if (teamIntroAction) {
        teamIntroAction.innerHTML = canEdit ? `
          <button onclick="window.startEditSection('team_intro')" class="text-xs font-bold uppercase text-gsGold hover:text-orange-600 flex items-center gap-1" title="Edit Intro">
            <span>✏️</span> Edit Intro
          </button>
        ` : '';
      }
    }
  }

  const teamGrid = $('about-team-grid');
  if (teamGrid) {
    // Sort core team first (is_partner false), then Partner cards (is_partner true), by display_order
    const sorted = [...teamMembersList].sort((a, b) => {
      const aPart = !!a.is_partner;
      const bPart = !!b.is_partner;
      if (aPart === bPart) {
        return (parseInt(a.display_order) || 0) - (parseInt(b.display_order) || 0);
      }
      return aPart ? 1 : -1;
    });

    let gridHtml = sorted.map(m => {
      const isEditing = editingMembers[m.id] && canEdit;
      if (isEditing) {
        return `
          <div class="card border-2 border-gsGold shadow-md bg-amber-50/20" id="card-member-${m.id}">
            <form id="edit-member-form-${m.id}" onsubmit="event.preventDefault(); window.saveTeamMember('${m.id}')" class="space-y-3">
              <div class="flex items-center justify-between border-b pb-1">
                <span class="text-xs font-bold uppercase tracking-wider text-gsBrown">Edit Member / Partner</span>
                <span class="badge bg-amber-100 text-gsBrown text-[10px]">Editing</span>
              </div>
              <div>
                <label class="block text-[11px] font-bold uppercase text-gray-600 mb-1">Full Name / Org Name *</label>
                <input type="text" name="name" required class="input-field text-sm font-bold py-1.5" value="${escapeAboutHtml(m.name)}" />
              </div>
              <div>
                <label class="block text-[11px] font-bold uppercase text-gray-600 mb-1">Role / Designation *</label>
                <input type="text" name="role" required class="input-field text-xs py-1.5" value="${escapeAboutHtml(m.role)}" />
              </div>
              <div>
                <label class="block text-[11px] font-bold uppercase text-gray-600 mb-1">Bio / Profile</label>
                <textarea name="bio" class="input-field text-xs h-20 py-1.5 leading-relaxed">${escapeAboutHtml(m.bio || '')}</textarea>
              </div>
              <div>
                <label class="block text-[11px] font-bold uppercase text-gray-600 mb-1">Photo URL</label>
                <input type="text" name="photo_url" class="input-field text-xs py-1.5" placeholder="/Screenshot_20260908_102638_WhatsApp.jpg" value="${escapeAboutHtml(m.photo_url || '')}" />
              </div>
              <div class="flex items-center justify-between pt-1">
                <label class="flex items-center gap-2 text-xs font-bold uppercase text-gray-700 cursor-pointer">
                  <input type="checkbox" name="is_partner" class="w-4 h-4 accent-gsGold" ${m.is_partner ? 'checked' : ''} />
                  <span>Partner Organization</span>
                </label>
                <div class="flex items-center gap-1">
                  <label class="text-[10px] font-bold uppercase text-gray-500">Order</label>
                  <input type="number" name="display_order" class="w-14 p-1 border rounded text-xs text-center" value="${m.display_order || 0}" />
                </div>
              </div>
              <div class="flex items-center justify-between pt-2 border-t">
                <button type="button" onclick="window.deleteTeamMember('${m.id}')" class="text-xs text-red-600 hover:text-red-800 font-bold uppercase" title="Remove member">Delete</button>
                <div class="flex gap-2">
                  <button type="button" onclick="window.cancelEditMember('${m.id}')" class="px-3 py-1.5 border border-gray-300 rounded text-xs text-gray-600 hover:bg-gray-100 font-bold uppercase">Cancel</button>
                  <button type="submit" class="btn-primary text-xs py-1.5 px-4">Save</button>
                </div>
              </div>
            </form>
          </div>
        `;
      }

      // Display Mode
      const isPartner = !!m.is_partner;
      const borderClass = isPartner ? 'border-l-4 border-gsBlue bg-blue-50/20' : 'border-l-4 border-gsGold bg-white';
      const badgeHtml = isPartner ? `
        <span class="badge bg-blue-100 text-gsBlue border border-blue-200">Partner Organization</span>
      ` : `
        <span class="badge bg-amber-100 text-gsBrown border border-amber-200">Core Team</span>
      `;
      const editBtn = canEdit ? `
        <button onclick="window.startEditMember('${m.id}')" class="p-1.5 rounded-full bg-white shadow border border-orange-200 text-gsBrown hover:bg-gsGold hover:text-white transition text-xs font-bold" title="Edit Member">
          ✏️
        </button>
      ` : '';

      const photoHtml = m.photo_url ? `
        <img src="${escapeAboutHtml(m.photo_url)}" alt="${escapeAboutHtml(m.name)}" onerror="this.onerror=null; this.src='https://placehold.co/120x120/F5A623/FFFFFF?text=${encodeURIComponent(m.name.slice(0, 2))}';" class="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm flex-shrink-0" />
      ` : `
        <div class="w-14 h-14 rounded-full ${isPartner ? 'bg-blue-100 text-gsBlue' : 'bg-amber-100 text-gsBrown'} font-display text-lg font-bold flex items-center justify-center border-2 border-white shadow-sm flex-shrink-0">
          ${m.name.slice(0, 2).toUpperCase()}
        </div>
      `;

      return `
        <div class="card ${borderClass} hover:shadow-lg transition-all duration-200 flex flex-col justify-between relative group">
          <div>
            <div class="flex items-center justify-between mb-3">
              ${badgeHtml}
              ${editBtn}
            </div>
            <div class="flex items-start gap-3 mb-3">
              ${photoHtml}
              <div>
                <h4 class="font-display text-lg uppercase tracking-tight text-gray-900 leading-snug">${escapeAboutHtml(m.name)}</h4>
                <p class="text-xs font-bold uppercase tracking-wider ${isPartner ? 'text-gsBlue' : 'text-gsGold'} mt-0.5">${escapeAboutHtml(m.role)}</p>
              </div>
            </div>
            <p class="text-xs text-gray-600 leading-relaxed mt-2">${escapeAboutHtml(m.bio || '')}</p>
          </div>
          ${canEdit ? `<div class="mt-3 pt-2 border-t text-[10px] text-gray-400 font-mono">Display Order: ${m.display_order || 0}</div>` : ''}
        </div>
      `;
    }).join('');

    if (canEdit) {
      if (isAddingMember) {
        gridHtml += `
          <div class="card border-2 border-gsGold shadow-md bg-amber-50/20">
            <form id="edit-member-form-new" onsubmit="event.preventDefault(); window.saveTeamMember('new')" class="space-y-3">
              <div class="flex items-center justify-between border-b pb-1">
                <span class="text-xs font-bold uppercase tracking-wider text-gsBrown">New Member / Partner</span>
                <span class="badge bg-green-100 text-green-800 text-[10px]">New</span>
              </div>
              <div>
                <label class="block text-[11px] font-bold uppercase text-gray-600 mb-1">Full Name / Org Name *</label>
                <input type="text" name="name" required class="input-field text-sm font-bold py-1.5" placeholder="e.g. Mentor Name / Institution" />
              </div>
              <div>
                <label class="block text-[11px] font-bold uppercase text-gray-600 mb-1">Role / Designation *</label>
                <input type="text" name="role" required class="input-field text-xs py-1.5" placeholder="e.g. Lead Craft Instructor" />
              </div>
              <div>
                <label class="block text-[11px] font-bold uppercase text-gray-600 mb-1">Bio / Profile</label>
                <textarea name="bio" class="input-field text-xs h-20 py-1.5 leading-relaxed" placeholder="Short biography..."></textarea>
              </div>
              <div>
                <label class="block text-[11px] font-bold uppercase text-gray-600 mb-1">Photo URL</label>
                <input type="text" name="photo_url" class="input-field text-xs py-1.5" placeholder="Image URL (optional)" />
              </div>
              <div class="flex items-center justify-between pt-1">
                <label class="flex items-center gap-2 text-xs font-bold uppercase text-gray-700 cursor-pointer">
                  <input type="checkbox" name="is_partner" class="w-4 h-4 accent-gsGold" />
                  <span>Partner Organization</span>
                </label>
                <div class="flex items-center gap-1">
                  <label class="text-[10px] font-bold uppercase text-gray-500">Order</label>
                  <input type="number" name="display_order" class="w-14 p-1 border rounded text-xs text-center" value="${teamMembersList.length}" />
                </div>
              </div>
              <div class="flex items-center justify-end gap-2 pt-2 border-t">
                <button type="button" onclick="window.cancelEditMember('new')" class="px-3 py-1.5 border border-gray-300 rounded text-xs text-gray-600 hover:bg-gray-100 font-bold uppercase">Cancel</button>
                <button type="submit" class="btn-primary text-xs py-1.5 px-4">Create Member</button>
              </div>
            </form>
          </div>
        `;
      } else {
        gridHtml += `
          <div onclick="window.startAddMember()" class="card border-2 border-dashed border-gsGold/60 hover:border-gsGold bg-orange-50/30 flex flex-col items-center justify-center p-6 text-center cursor-pointer transition hover:bg-orange-50 group min-h-[220px]">
            <span class="text-3xl mb-2 text-gsGold group-hover:scale-110 transition-transform">➕</span>
            <span class="font-display uppercase text-sm font-bold text-gsBrown">Add Team / Partner Member</span>
            <span class="text-[11px] text-gray-500 mt-1">${masterAdmin ? "Master Admin" : "Manager"} Affordance</span>
          </div>
        `;
      }
    }

    teamGrid.innerHTML = gridHtml;
  }

  // --- 4. ADDRESS & LOCATION SECTION ---
  const addressCard = $('about-address-card');
  if (addressCard) {
    if (editingSections.address && canEdit) {
      addressCard.innerHTML = `
        <div class="space-y-4">
          <div class="flex items-center justify-between border-b pb-2 border-orange-200">
            <h3 class="font-display uppercase text-lg text-gsBrown flex items-center gap-2">
              <span>📍</span> Editing Address & Locations (${masterAdmin ? 'Master Admin' : 'Manager'} In-Place)
            </h3>
            <span class="badge bg-amber-100 text-gsBrown text-xs">Editing Mode</span>
          </div>
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">Headquarters & Regional Training Hubs Details</label>
            <textarea id="edit-textarea-address" class="input-field h-44 font-sans text-sm leading-relaxed border-2 border-gsRed/60 bg-amber-50/20 shadow-inner">${escapeAboutHtml(aboutContentMap.address)}</textarea>
            <p class="text-[11px] text-gray-500 mt-1">Include full location addresses, phone contacts, and email.</p>
          </div>
          <div class="flex items-center justify-end gap-3 pt-2 border-t">
            <button type="button" onclick="window.cancelEditSection('address')" class="px-4 py-2 border border-gray-300 text-gray-700 rounded text-xs font-bold uppercase tracking-wider hover:bg-gray-100 transition">Cancel</button>
            <button type="button" onclick="window.saveSection('address')" class="btn-primary text-xs py-2 px-5 shadow">Save Changes</button>
          </div>
        </div>
      `;
    } else {
      const editBtn = canEdit ? `
        <button onclick="window.startEditSection('address')" class="absolute top-4 right-4 p-2 rounded-full bg-white shadow-md border border-orange-200 text-gsBrown hover:bg-gsGold hover:text-white transition flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider" title="Edit Address in-place">
          <span>✏️</span> <span class="hidden sm:inline">Edit</span>
        </button>
      ` : '';

      addressCard.innerHTML = `
        ${editBtn}
        <div class="text-center max-w-2xl mx-auto">
          <div class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gsRed mb-2">
            <span>📍</span> Section 4: Physical Hubs & Contact
          </div>
          <h3 class="text-2xl md:text-3xl font-display uppercase tracking-tight text-gray-900 mb-4">Visit Our Studios & Incubation Hubs</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-left my-4">
            <div class="p-4 bg-orange-50/80 rounded-lg border border-orange-200">
              <span class="badge bg-gsGold text-white text-[10px] mb-2 inline-block">Headquarters Hub</span>
              <p class="font-bold text-gray-900 text-sm">Graphitti Studios SMART ICT</p>
              <p class="text-xs text-gray-700 mt-1 font-medium">Blk 6 Iye Plaza, Refinery Road</p>
              <p class="text-xs text-gray-700">Effurun, Delta State, Nigeria</p>
            </div>
            <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <span class="badge bg-gsBrown text-white text-[10px] mb-2 inline-block">Regional Training Hubs</span>
              <p class="font-bold text-gray-900 text-sm">Festac Town, Lagos State</p>
              <p class="text-xs text-gray-600 mt-1 font-medium">GRA, Benin City, Edo State</p>
              <p class="text-xs text-gray-500 mt-1">Secondary & Tertiary Incubators</p>
            </div>
          </div>

          <div class="p-4 bg-amber-50/40 rounded-lg border border-amber-200 text-center mb-6">
            <div class="whitespace-pre-line text-sm text-gray-700 leading-relaxed font-medium">${escapeAboutHtml(aboutContentMap.address)}</div>
            <div class="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs font-bold">
              <a href="tel:08030796898" class="text-gsBrown hover:underline flex items-center gap-1">📞 (+234) 08030796898</a>
              <span class="text-gray-300">|</span>
              <a href="mailto:barbara06sfx@gmail.com" class="text-gsGold hover:underline flex items-center gap-1">✉️ barbara06sfx@gmail.com</a>
            </div>
          </div>

          <div class="w-full h-64 bg-gray-200 rounded-lg overflow-hidden shadow-inner border border-gray-200">
            <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3971.05445214695!2d5.772590214765363!3d5.559288195968565!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1041ad7000000001%3A0x0!2sRefinery%20Rd%2C%20Effurun%2C%20Nigeria!5e0!3m2!1sen!2sng!4v1700000000000!5m2!1sen!2sng" width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
          </div>
        </div>
      `;
    }
  }
}

// Window actions for About inline editing
window.startEditSection = function(sectionKey) {
  if (!isMasterOrManager()) return;
  editingSections[sectionKey] = true;
  renderAboutRoom();
};

window.cancelEditSection = function(sectionKey) {
  editingSections[sectionKey] = false;
  renderAboutRoom();
};

window.saveSection = async function(sectionKey) {
  const el = $(`edit-textarea-${sectionKey}`);
  if (!el) return;
  const newContent = el.value.trim();
  if (!newContent) {
    showAboutToast('Content cannot be empty.', false);
    return;
  }

  aboutContentMap[sectionKey] = newContent;
  localStorage.setItem('gs_about_' + sectionKey, newContent);
  editingSections[sectionKey] = false;

  let cloudSuccess = false;
  try {
    const payload = {
      section_key: sectionKey,
      content_text: newContent,
      updated_at: new Date().toISOString(),
      updated_by: (currentUser?.data?.id && typeof currentUser.data.id === 'string' && currentUser.data.id.length >= 32) ? currentUser.data.id : null
    };
    const { error } = await supabase
      .from('gs_about_content')
      .upsert(payload, { onConflict: 'section_key' });
    if (!error) cloudSuccess = true;
  } catch (err) {
    console.warn('Supabase save error:', err);
  }

  showAboutToast(cloudSuccess ? 'Section updated and synced to Supabase!' : 'Section updated in browser storage.');
  renderAboutRoom();
};

window.startEditMember = function(memberId) {
  if (!isMasterOrManager()) return;
  editingMembers[memberId] = true;
  renderAboutRoom();
};

window.cancelEditMember = function(memberId) {
  if (memberId === 'new') {
    isAddingMember = false;
  } else {
    editingMembers[memberId] = false;
  }
  renderAboutRoom();
};

window.startAddMember = function() {
  if (!isMasterOrManager()) return;
  isAddingMember = true;
  renderAboutRoom();
};

window.saveTeamMember = async function(memberId) {
  const form = $(`edit-member-form-${memberId}`);
  if (!form) return;
  const fd = new FormData(form);
  const name = fd.get('name')?.toString().trim();
  const role = fd.get('role')?.toString().trim();
  const bio = fd.get('bio')?.toString().trim();
  const photo_url = fd.get('photo_url')?.toString().trim() || '';
  const is_partner = fd.get('is_partner') === 'on';
  const display_order = parseInt(fd.get('display_order')?.toString() || '0');

  if (!name || !role) {
    showAboutToast('Name and Role are required.', false);
    return;
  }

  const memberData = {
    name,
    role,
    bio,
    photo_url,
    is_partner,
    display_order
  };

  let cloudSuccess = false;

  if (memberId === 'new') {
    try {
      const { data, error } = await supabase
        .from('gs_team_members')
        .insert([memberData])
        .select();
      if (!error && data && data.length > 0) {
        teamMembersList.push(data[0]);
        cloudSuccess = true;
      } else {
        memberData.id = 'loc-' + Date.now();
        teamMembersList.push(memberData);
      }
    } catch(e) {
      memberData.id = 'loc-' + Date.now();
      teamMembersList.push(memberData);
    }
    isAddingMember = false;
  } else {
    memberData.id = memberId;
    try {
      const { error } = await supabase
        .from('gs_team_members')
        .update(memberData)
        .eq('id', memberId);
      if (!error) cloudSuccess = true;
    } catch(e) {}

    const idx = teamMembersList.findIndex(m => m.id === memberId);
    if (idx !== -1) {
      teamMembersList[idx] = { ...teamMembersList[idx], ...memberData };
    }
    editingMembers[memberId] = false;
  }

  localStorage.setItem('gs_team_members_local', JSON.stringify(teamMembersList));
  showAboutToast(cloudSuccess ? 'Member saved to Supabase!' : 'Member saved in browser storage.');
  renderAboutRoom();
};

window.deleteTeamMember = async function(memberId) {
  if (!confirm('Are you sure you want to remove this member / partner?')) return;
  try {
    await supabase.from('gs_team_members').delete().eq('id', memberId);
  } catch(e) {}

  teamMembersList = teamMembersList.filter(m => m.id !== memberId);
  delete editingMembers[memberId];
  localStorage.setItem('gs_team_members_local', JSON.stringify(teamMembersList));
  showAboutToast('Member removed.');
  renderAboutRoom();
};

// Initial boot load for About content
loadAboutContent();



// ==========================================
// HOW GRAPHITTI WORKS — 9-SECTION DYNAMIC & INLINE EDITING MODULE
// ==========================================

let howItWorksContentMap = {
  intro: `Graphitti is a Creative Entrepreneurship School powered by ESGMC and Graphitti Studios. School placements (like Day Spring) are one entry channel among a growing network of partner schools — not the whole operation. We bridge hands-on craft production with real-market mechanics.`,

  skills: `Culinary Arts & Food Production
Leather Works & Bag Making
Resin Jewellery Making
Arts & Crafts
Film/Theatre Arts & Animation
Fashion Design & Garment Making (incl. Gift Packaging)
Digital Creation & Media Skills`,

  institute_programs: `Shadow SDG Entrepreneur (Available as School Package + Institute)
Commercial Creative Entrepreneur (Available as School Package + Institute)
Digital Tech-Creative (Available as School Package + Institute)
Cultural Heritage Creative (Available as School Package + Institute)
Freelance/Portfolio (Institute only, Public)`,

  progression: `Starting Identity → Junior (Responsible-Use Foundation) → Senior (Producer/Asset-Owner, Grant-Eligible) → Graduate (Bank of Industry & Credit Access)

Ongoing Marketplace Connection + Mentorship runs alongside all 4 stages.`,

  marketplace: `Permanent product listings; Connector/Buyer referral-credit model, tracked and awarded by Graphitti, locked permanently to whichever Connector is tied to a sale; PLUS Graphitti's own direct product kits (Resin Kit, Leather Kits, Craft Toolboxes) shown as listed products in their own right, not just referral traffic.`,

  shadow_framework: `Graphitti Creative Entrepreneurship School runs on ESGMC's patented Special Shadow Global Companies (SSGC) framework — a system where young people and adults build and run real virtual enterprises, learning by doing rather than simulating.

Within it, each student develops their own Shadow Production House, their virtual company — they run it like CEOs, visually arranged like a real enterprise, while growing toward becoming a formally registered business.

Graphitti itself started this way — as a shadow of a larger institute — and continues working and training students along the same path.`,

  bridge: `Capital-access layer, gated to cooperative (parents are the members):

• Tier 1: Working-capital top-up, repaid via 10% of future sales (revolving, auto-deducted)
• Tier 2: Soft loan up to ₦100,000, for business growth or further training

Cooperative Flow:
Parent joins cooperative → Child writes letter to parent → Parent acknowledges → Parent writes letter to Cooperative Committee for human review.

Youth's Role: Making their own progress and craftsmanship visible as part of this process.
Teacher's Role: Teachers join the cooperative, document the child's process, make it visible, and mentor.`,

  trainer_track: `School-assigned → Market-assigned (Details coming soon) → Independent Training Enterprise → Master Trainer

Teacher Training Enterprise track sits under Master Trainer.`,

  coming_soon: `• Market Exhibition Connector roles
• External Trainer Intake
• Storytelling & Film Production`
};

let editingHowSections = {
  intro: false,
  skills: false,
  institute_programs: false,
  progression: false,
  marketplace: false,
  shadow_framework: false,
  bridge: false,
  trainer_track: false,
  coming_soon: false
};

async function loadHowItWorksContent() {
  try {
    const { data, error } = await supabase.from('gs_how_it_works').select('*');
    if (!error && data && data.length > 0) {
      data.forEach(item => {
        if (item.section_key && item.content_text) {
          howItWorksContentMap[item.section_key] = item.content_text;
        }
      });
    } else {
      Object.keys(howItWorksContentMap).forEach(k => {
        const saved = localStorage.getItem('gs_how_' + k);
        if (saved) howItWorksContentMap[k] = saved;
      });
    }
  } catch (e) {
    Object.keys(howItWorksContentMap).forEach(k => {
      const saved = localStorage.getItem('gs_how_' + k);
      if (saved) howItWorksContentMap[k] = saved;
    });
  }

  renderHowItWorksRoom();
}

function getHowEditBtnHtml(sectionKey, canEdit) {
  if (!canEdit) return '';
  return `
    <button onclick="window.startEditHowSection('${sectionKey}')" class="absolute top-4 right-4 p-2 rounded-full bg-white shadow-md border border-orange-200 text-gsBrown hover:bg-gsGold hover:text-white transition flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider" title="Edit this section in-place">
      <span>✏️</span> <span class="hidden sm:inline">Edit</span>
    </button>
  `;
}

function renderHowItWorksRoom() {
  const canEdit = isMasterOrManager();
  const masterAdmin = isAppMaster();

  // Master Admin / Manager Banner
  const banner = $('how-master-banner');
  const roleBadgeText = $('how-role-badge-text');
  if (banner) {
    if (canEdit) {
      banner.classList.remove('hidden');
      if (roleBadgeText) {
        roleBadgeText.textContent = masterAdmin
          ? 'Master Admin Editorial Privileges Active (Owner & Fortune)'
          : 'Manager Editorial Privileges Active (Barbara Abieyuwa Omoregie)';
      }
    } else {
      banner.classList.add('hidden');
    }
  }

  // --- 1. INTRO SECTION ---
  const introCard = $('how-intro-card');
  if (introCard) {
    if (editingHowSections.intro && canEdit) {
      introCard.innerHTML = `
        <div class="space-y-4">
          <div class="flex items-center justify-between border-b pb-2 border-orange-200">
            <h3 class="font-display uppercase text-lg text-gsBrown flex items-center gap-2">
              <span>🖐️</span> Editing Section 1: Intro (${masterAdmin ? 'Master Admin' : 'Manager'} In-Place)
            </h3>
            <span class="badge bg-amber-100 text-gsBrown text-xs">Editing Mode</span>
          </div>
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">Intro & Operational Model</label>
            <textarea id="edit-how-textarea-intro" class="input-field h-40 font-sans text-sm leading-relaxed border-2 border-gsGold/60 bg-amber-50/20 shadow-inner">${escapeAboutHtml(howItWorksContentMap.intro)}</textarea>
          </div>
          <div class="flex items-center justify-end gap-3 pt-2 border-t">
            <button type="button" onclick="window.cancelEditHowSection('intro')" class="px-4 py-2 border border-gray-300 text-gray-700 rounded text-xs font-bold uppercase tracking-wider hover:bg-gray-100 transition">Cancel</button>
            <button type="button" onclick="window.saveHowSection('intro')" class="btn-primary text-xs py-2 px-5 shadow">Save Changes</button>
          </div>
        </div>
      `;
    } else {
      introCard.innerHTML = `
        ${getHowEditBtnHtml('intro', canEdit)}
        <div class="pr-10">
          <div class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gsGold mb-2">
            <span>🖐️</span> Section 1: Intro & Operational Scope
          </div>
          <h3 class="text-2xl md:text-3xl font-display uppercase tracking-tight text-gray-900 mb-3">Creative Entrepreneurship School</h3>
          <p class="text-xs uppercase font-bold text-gsBrown tracking-wider font-display mb-4">Powered by ESGMC & Graphitti Studios</p>
          
          <div class="p-4 bg-orange-50/80 border-l-4 border-gsGold rounded-r-lg mb-4 text-gray-800 text-sm leading-relaxed font-medium">
            ${escapeAboutHtml(howItWorksContentMap.intro)}
          </div>

          <div class="p-3 bg-amber-50/50 rounded border border-amber-200 text-xs text-amber-950 flex items-start gap-2.5">
            <span class="text-base flex-shrink-0">🏫</span>
            <div>
              <span class="font-bold uppercase tracking-wide">Network Notice:</span>
              <span>School placements (such as Day Spring) are one entry channel among a growing network of partner schools — not the whole operation. Graphitti equips schools and individuals with full production and business depth.</span>
            </div>
          </div>
        </div>
      `;
    }
  }

  // --- 2. SEVEN INDUSTRY SKILLS ---
  const skillsCard = $('how-skills-card');
  if (skillsCard) {
    if (editingHowSections.skills && canEdit) {
      skillsCard.innerHTML = `
        <div class="space-y-4">
          <div class="flex items-center justify-between border-b pb-2 border-orange-200">
            <h3 class="font-display uppercase text-lg text-gsBrown flex items-center gap-2">
              <span>🛠️</span> Editing Section 2: Seven Skills (${masterAdmin ? 'Master Admin' : 'Manager'} In-Place)
            </h3>
            <span class="badge bg-amber-100 text-gsBrown text-xs">Editing Mode</span>
          </div>
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">Skills Description & List</label>
            <textarea id="edit-how-textarea-skills" class="input-field h-48 font-sans text-sm leading-relaxed border-2 border-gsBrown/60 bg-amber-50/20 shadow-inner">${escapeAboutHtml(howItWorksContentMap.skills)}</textarea>
          </div>
          <div class="flex items-center justify-end gap-3 pt-2 border-t">
            <button type="button" onclick="window.cancelEditHowSection('skills')" class="px-4 py-2 border border-gray-300 text-gray-700 rounded text-xs font-bold uppercase tracking-wider hover:bg-gray-100 transition">Cancel</button>
            <button type="button" onclick="window.saveHowSection('skills')" class="btn-primary text-xs py-2 px-5 shadow">Save Changes</button>
          </div>
        </div>
      `;
    } else {
      const skillItems = [
        { icon: '🍳', title: 'Culinary Arts & Food Production', desc: 'Pastry, food packaging, commercial baking, and safe hygiene standards.' },
        { icon: '👜', title: 'Leather Works & Bag Making', desc: 'Precision hand-stitching, pattern drafting, bags, belts, and bespoke accessories.' },
        { icon: '💎', title: 'Resin Jewellery Making', desc: 'Botanical casting, color pigment mastery, epoxy curing, and luxury statement pieces.' },
        { icon: '🎨', title: 'Arts & Crafts', desc: 'Commercial home decor, sculptural forms, upcycled crafts, and fine artifacts.' },
        { icon: '🎬', title: 'Film/Theatre Arts & Animation', desc: 'Cinematography, SFX makeup, stagecraft, set construction, and digital animation.' },
        { icon: '👗', title: 'Fashion Design & Garment Making', desc: 'Pattern drafting, tailoring mechanics, and specialized gift packaging design.' },
        { icon: '💻', title: 'Digital Creation & Media Skills', desc: 'Content marketing, commercial photography, digital assets, and brand storytelling.' }
      ];

      skillsCard.innerHTML = `
        ${getHowEditBtnHtml('skills', canEdit)}
        <div class="pr-10">
          <div class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gsBrown mb-2">
            <span>🛠️</span> Section 2: Technical & Commercial Vocations
          </div>
          <h3 class="text-2xl md:text-3xl font-display uppercase tracking-tight text-gray-900 mb-2">Seven Industry Skills</h3>
          <p class="text-gray-600 text-sm mb-6">Rigorous hands-on trades engineered for real consumer demand and scalable production:</p>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            ${skillItems.map((item, idx) => `
              <div class="p-4 rounded-lg border border-orange-100 bg-orange-50/30 hover:bg-orange-50 hover:shadow-sm transition flex flex-col justify-between ${idx === 6 ? 'sm:col-span-2 lg:col-span-1' : ''}">
                <div>
                  <div class="flex items-center gap-2.5 mb-2">
                    <span class="text-2xl">${item.icon}</span>
                    <h4 class="font-display uppercase text-sm font-bold text-gray-900 leading-snug">${item.title}</h4>
                  </div>
                  <p class="text-xs text-gray-600 leading-relaxed">${item.desc}</p>
                </div>
                <div class="mt-3 pt-2 border-t border-orange-100 text-[10px] font-bold uppercase text-gsGold tracking-wider">
                  Track ${idx + 1} · Certified Curriculum
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
  }

  // --- 3. GRAPHITTI INSTITUTE PROGRAMS ---
  const instituteCard = $('how-institute-card');
  if (instituteCard) {
    if (editingHowSections.institute_programs && canEdit) {
      instituteCard.innerHTML = `
        <div class="space-y-4">
          <div class="flex items-center justify-between border-b pb-2 border-orange-200">
            <h3 class="font-display uppercase text-lg text-gsBrown flex items-center gap-2">
              <span>🏛️</span> Editing Section 3: Institute Programs (${masterAdmin ? 'Master Admin' : 'Manager'} In-Place)
            </h3>
            <span class="badge bg-amber-100 text-gsBrown text-xs">Editing Mode</span>
          </div>
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">5 Institute Program Tracks</label>
            <textarea id="edit-how-textarea-institute_programs" class="input-field h-48 font-sans text-sm leading-relaxed border-2 border-gsBlue/60 bg-amber-50/20 shadow-inner">${escapeAboutHtml(howItWorksContentMap.institute_programs)}</textarea>
          </div>
          <div class="flex items-center justify-end gap-3 pt-2 border-t">
            <button type="button" onclick="window.cancelEditHowSection('institute_programs')" class="px-4 py-2 border border-gray-300 text-gray-700 rounded text-xs font-bold uppercase tracking-wider hover:bg-gray-100 transition">Cancel</button>
            <button type="button" onclick="window.saveHowSection('institute_programs')" class="btn-primary text-xs py-2 px-5 shadow">Save Changes</button>
          </div>
        </div>
      `;
    } else {
      const programs = [
        {
          title: 'Shadow SDG Entrepreneur',
          badge: 'Available as School Package ✓',
          badgeClass: 'bg-green-100 text-green-800 border-green-200',
          institute: true,
          desc: 'UN SDG 4, 8, 9, 12 focus. Flagship skill: Resin Jewellery. 6-week curriculum ending in a live commercial Market Day.'
        },
        {
          title: 'Commercial Creative Entrepreneur',
          badge: 'Available as School Package ✓',
          badgeClass: 'bg-green-100 text-green-800 border-green-200',
          institute: true,
          desc: 'Market-driven art, bespoke fashion, high-turnover products sold directly into active Nigerian and regional markets.'
        },
        {
          title: 'Digital Tech-Creative',
          badge: 'Available as School Package ✓',
          badgeClass: 'bg-green-100 text-green-800 border-green-200',
          institute: true,
          desc: 'Digital asset fabrication, hybrid media workstations, branding pipelines, remote client acquisition, minimal physical overhead.'
        },
        {
          title: 'Cultural Heritage Creative',
          badge: 'Available as School Package ✓',
          badgeClass: 'bg-green-100 text-green-800 border-green-200',
          institute: true,
          desc: 'Indigenous storytelling, Nollywood-adjacent stagecraft, cultural textiles, authentic African artifacts with full production depth.'
        },
        {
          title: 'Freelance / Portfolio',
          badge: 'Institute Only (Public)',
          badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
          institute: true,
          desc: 'Gig-economy rate cards, agency-grade portfolios, cinematographers, SFX MUAs, client contracts, and fee management.'
        }
      ];

      instituteCard.innerHTML = `
        ${getHowEditBtnHtml('institute_programs', canEdit)}
        <div class="pr-10">
          <div class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gsBlue mb-2">
            <span>🏛️</span> Section 3: Enterprise Program Tracks
          </div>
          <h3 class="text-2xl md:text-3xl font-display uppercase tracking-tight text-gray-900 mb-2">Graphitti Institute</h3>
          <p class="text-gray-600 text-sm mb-6">Five specialized pathways designed to transition students and adults from hobbyists to enterprise operators:</p>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            ${programs.map(p => `
              <div class="card border-t-4 border-gsBlue flex flex-col justify-between hover:shadow-md transition">
                <div>
                  <div class="flex flex-wrap items-center gap-2 mb-3">
                    <span class="badge ${p.badgeClass} border">${p.badge}</span>
                    <span class="badge bg-blue-50 text-blue-700 border border-blue-200">Institute</span>
                  </div>
                  <h4 class="font-display uppercase text-lg text-gray-900 mb-2">${p.title}</h4>
                  <p class="text-xs text-gray-600 leading-relaxed">${p.desc}</p>
                </div>
                <div class="mt-4 pt-3 border-t">
                  <button onclick="showRoom('room-apply-hub')" class="text-xs font-bold uppercase text-gsBlue hover:underline flex items-center gap-1">Apply for this Track →</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
  }

  // --- 4. IDENTITY PROGRESSION (School Package Specifically) ---
  const progCard = $('how-progression-card');
  if (progCard) {
    if (editingHowSections.progression && canEdit) {
      progCard.innerHTML = `
        <div class="space-y-4">
          <div class="flex items-center justify-between border-b pb-2 border-orange-200">
            <h3 class="font-display uppercase text-lg text-gsBrown flex items-center gap-2">
              <span>📈</span> Editing Section 4: Identity Progression (${masterAdmin ? 'Master Admin' : 'Manager'} In-Place)
            </h3>
            <span class="badge bg-amber-100 text-gsBrown text-xs">Editing Mode</span>
          </div>
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">4-Stage School Package Path</label>
            <textarea id="edit-how-textarea-progression" class="input-field h-40 font-sans text-sm leading-relaxed border-2 border-gsGreen/60 bg-amber-50/20 shadow-inner">${escapeAboutHtml(howItWorksContentMap.progression)}</textarea>
          </div>
          <div class="flex items-center justify-end gap-3 pt-2 border-t">
            <button type="button" onclick="window.cancelEditHowSection('progression')" class="px-4 py-2 border border-gray-300 text-gray-700 rounded text-xs font-bold uppercase tracking-wider hover:bg-gray-100 transition">Cancel</button>
            <button type="button" onclick="window.saveHowSection('progression')" class="btn-primary text-xs py-2 px-5 shadow">Save Changes</button>
          </div>
        </div>
      `;
    } else {
      const stages = [
        { num: '01', title: 'Starting Identity', sub: 'Orientation & Idea Validation', desc: 'Enrolled student explores raw craft mechanics, formulates their first Guess Business Plan, and registers their Shadow Production House.' },
        { num: '02', title: 'Junior Tier', sub: 'Responsible-Use Foundation', desc: 'Mastery of studio safety protocols, residue and waste management planning, material ethics, and baseline product batch consistency.' },
        { num: '03', title: 'Senior Tier', sub: 'Producer & Asset-Owner', desc: 'Full batch production, price setting, market day execution, inventory management, and eligibility for institutional enterprise grants.' },
        { num: '04', title: 'Graduate Tier', sub: 'Bank of Industry / Credit Access', desc: 'Direct access to micro-credit, formal BOI facilities, enterprise scaling, independent registration, and ongoing incubator syndication.' }
      ];

      progCard.innerHTML = `
        ${getHowEditBtnHtml('progression', canEdit)}
        <div class="pr-10">
          <div class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-green-700 mb-2">
            <span>📈</span> Section 4: School Package Exclusive Track
          </div>
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <h3 class="text-2xl md:text-3xl font-display uppercase tracking-tight text-gray-900">Four-Stage Identity Progression</h3>
            <span class="badge bg-green-100 text-green-900 border border-green-300 self-start sm:self-auto">School Package Exclusive</span>
          </div>
          <p class="text-gray-600 text-sm mb-6">Structured developmental roadmap for school pupils to mature from creative beginners into bankable youth entrepreneurs:</p>

          <!-- 4-Stage Horizontal Pipeline -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative">
            ${stages.map((s, idx) => `
              <div class="p-4 bg-white rounded-lg border-2 ${idx === 3 ? 'border-green-500 bg-green-50/20' : 'border-gray-200'} shadow-sm flex flex-col justify-between">
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-bold font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-700">STAGE ${s.num}</span>
                    ${idx < 3 ? '<span class="text-gray-400 font-bold hidden lg:inline">→</span>' : '<span class="text-green-600 font-bold">★</span>'}
                  </div>
                  <h4 class="font-display uppercase text-base text-gray-900 font-bold">${s.title}</h4>
                  <p class="text-[11px] font-bold text-gsGreen uppercase tracking-wider mb-2">${s.sub}</p>
                  <p class="text-xs text-gray-600 leading-relaxed">${s.desc}</p>
                </div>
                <div class="mt-4 pt-2 border-t border-gray-100 text-[10px] text-gray-400 font-bold uppercase">
                  Step ${idx + 1} of 4
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Running Connection Banner -->
          <div class="mt-6 p-4 rounded-lg bg-gradient-to-r from-gray-900 via-amber-950 to-gray-900 text-gsGold border border-gsGold/40 flex items-center justify-between gap-4 shadow-sm">
            <div class="flex items-center gap-3">
              <span class="text-xl">⚡</span>
              <div>
                <p class="text-xs font-bold uppercase tracking-wider text-white">Parallel Growth Backbone</p>
                <p class="text-xs text-orange-200">Ongoing Marketplace Connection + Mentorship runs alongside all 4 stages continuously.</p>
              </div>
            </div>
            <button onclick="showRoom('room-marketplace')" class="btn-primary text-xs py-1.5 px-3 whitespace-nowrap bg-gsGold text-gray-900 font-bold hover:bg-orange-400">View Market →</button>
          </div>
        </div>
      `;
    }
  }

  // --- 5. MARKETPLACE & DIRECT PRODUCT KITS ---
  const marketCard = $('how-marketplace-card');
  if (marketCard) {
    if (editingHowSections.marketplace && canEdit) {
      marketCard.innerHTML = `
        <div class="space-y-4">
          <div class="flex items-center justify-between border-b pb-2 border-orange-200">
            <h3 class="font-display uppercase text-lg text-gsBrown flex items-center gap-2">
              <span>🛍️</span> Editing Section 5: Marketplace (${masterAdmin ? 'Master Admin' : 'Manager'} In-Place)
            </h3>
            <span class="badge bg-amber-100 text-gsBrown text-xs">Editing Mode</span>
          </div>
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">Marketplace & Product Kits Engine</label>
            <textarea id="edit-how-textarea-marketplace" class="input-field h-40 font-sans text-sm leading-relaxed border-2 border-gsGold/60 bg-amber-50/20 shadow-inner">${escapeAboutHtml(howItWorksContentMap.marketplace)}</textarea>
          </div>
          <div class="flex items-center justify-end gap-3 pt-2 border-t">
            <button type="button" onclick="window.cancelEditHowSection('marketplace')" class="px-4 py-2 border border-gray-300 text-gray-700 rounded text-xs font-bold uppercase tracking-wider hover:bg-gray-100 transition">Cancel</button>
            <button type="button" onclick="window.saveHowSection('marketplace')" class="btn-primary text-xs py-2 px-5 shadow">Save Changes</button>
          </div>
        </div>
      `;
    } else {
      marketCard.innerHTML = `
        ${getHowEditBtnHtml('marketplace', canEdit)}
        <div class="pr-10">
          <div class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gsGold mb-2">
            <span>🛍️</span> Section 5: Commercial Distribution & Dual-Engine Commerce
          </div>
          <h3 class="text-2xl md:text-3xl font-display uppercase tracking-tight text-gray-900 mb-2">Graphitti Marketplace & Direct Product Kits</h3>
          <p class="text-gray-600 text-sm mb-6">A sustainable commercial pipeline connecting youth creators with retail buyers, institutional patrons, and material supplies:</p>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div class="p-5 bg-orange-50/40 rounded-lg border-t-4 border-gsGold border-x border-b border-orange-100">
              <span class="text-2xl mb-2 block">📦</span>
              <h4 class="font-display uppercase text-base text-gray-900 mb-1">Permanent Product Listings</h4>
              <p class="text-xs text-gray-600 leading-relaxed">Student and alumni items stay listed perpetually. Finished items are not one-day curiosities; they remain cataloged for continuous commercial sale and reorders.</p>
            </div>

            <div class="p-5 bg-blue-50/40 rounded-lg border-t-4 border-gsBlue border-x border-b border-blue-100">
              <span class="text-2xl mb-2 block">🔗</span>
              <h4 class="font-display uppercase text-base text-gray-900 mb-1">Connector / Buyer Referral Model</h4>
              <p class="text-xs text-gray-600 leading-relaxed">Referral credits tracked and awarded directly by Graphitti. Permanent attribution: credits remain locked to whichever Connector generated the buyer relationship.</p>
            </div>

            <div class="p-5 bg-green-50/40 rounded-lg border-t-4 border-gsGreen border-x border-b border-green-100">
              <span class="text-2xl mb-2 block">🧰</span>
              <h4 class="font-display uppercase text-base text-gray-900 mb-1">Graphitti Direct Product Kits</h4>
              <p class="text-xs text-gray-600 leading-relaxed">Graphitti's own starter toolsets (Resin Jewellery Master Kits, Leatherworking Toolboxes, Raw Pigments) are listed as commercial products in their own right, not just referral traffic.</p>
            </div>
          </div>
        </div>
      `;
    }
  }

  // --- 6. SHADOW ENTREPRENEURSHIP FRAMEWORK (SSGC Patented) ---
  const shadowCard = $('how-shadow-card');
  if (shadowCard) {
    if (editingHowSections.shadow_framework && canEdit) {
      shadowCard.innerHTML = `
        <div class="space-y-4">
          <div class="flex items-center justify-between border-b pb-2 border-orange-200">
            <h3 class="font-display uppercase text-lg text-gsBrown flex items-center gap-2">
              <span>🏢</span> Editing Section 6: SSGC Framework (${masterAdmin ? 'Master Admin' : 'Manager'} In-Place)
            </h3>
            <span class="badge bg-amber-100 text-gsBrown text-xs">Editing Mode</span>
          </div>
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">Exact SSGC Framework Copy (Do Not Reword)</label>
            <textarea id="edit-how-textarea-shadow_framework" class="input-field h-52 font-sans text-sm leading-relaxed border-2 border-gray-900 bg-amber-50/20 shadow-inner">${escapeAboutHtml(howItWorksContentMap.shadow_framework)}</textarea>
          </div>
          <div class="flex items-center justify-end gap-3 pt-2 border-t">
            <button type="button" onclick="window.cancelEditHowSection('shadow_framework')" class="px-4 py-2 border border-gray-300 text-gray-700 rounded text-xs font-bold uppercase tracking-wider hover:bg-gray-100 transition">Cancel</button>
            <button type="button" onclick="window.saveHowSection('shadow_framework')" class="btn-primary text-xs py-2 px-5 shadow">Save Changes</button>
          </div>
        </div>
      `;
    } else {
      const paras = (howItWorksContentMap.shadow_framework || '').split(/\n\s*\n/).filter(p => p.trim().length > 0);
      shadowCard.innerHTML = `
        ${getHowEditBtnHtml('shadow_framework', canEdit)}
        <div class="pr-10">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded bg-gray-900 text-gsGold text-xs font-bold uppercase tracking-widest mb-3">
            <span>🛡️</span> ESGMC Patented Framework · SSGC
          </div>
          <h3 class="text-2xl md:text-3xl font-display uppercase tracking-tight text-gray-900 mb-1">Shadow Entrepreneurship Framework</h3>
          <p class="text-xs uppercase font-bold text-gsBrown tracking-wider font-display mb-6">Shadow School · Shadow Production House</p>

          <div class="space-y-4 text-gray-800 text-base leading-relaxed">
            ${paras.map((p, idx) => {
              if (idx === 0) {
                return `<p class="text-lg font-medium text-gray-900 border-l-4 border-gsGold pl-4 bg-orange-50/60 py-2.5 rounded-r">${escapeAboutHtml(p)}</p>`;
              }
              return `<p>${escapeAboutHtml(p)}</p>`;
            }).join('')}
          </div>
        </div>
      `;
    }
  }

  // --- 7. GRAPHITTI BRIDGE (Capital Access Layer & Cooperative) ---
  const bridgeCard = $('how-bridge-card');
  if (bridgeCard) {
    if (editingHowSections.bridge && canEdit) {
      bridgeCard.innerHTML = `
        <div class="space-y-4">
          <div class="flex items-center justify-between border-b pb-2 border-orange-200">
            <h3 class="font-display uppercase text-lg text-gsBrown flex items-center gap-2">
              <span>🌉</span> Editing Section 7: Graphitti Bridge (${masterAdmin ? 'Master Admin' : 'Manager'} In-Place)
            </h3>
            <span class="badge bg-amber-100 text-gsBrown text-xs">Editing Mode</span>
          </div>
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">Cooperative Capital-Access Protocol</label>
            <textarea id="edit-how-textarea-bridge" class="input-field h-52 font-sans text-sm leading-relaxed border-2 border-gsRed/60 bg-amber-50/20 shadow-inner">${escapeAboutHtml(howItWorksContentMap.bridge)}</textarea>
          </div>
          <div class="flex items-center justify-end gap-3 pt-2 border-t">
            <button type="button" onclick="window.cancelEditHowSection('bridge')" class="px-4 py-2 border border-gray-300 text-gray-700 rounded text-xs font-bold uppercase tracking-wider hover:bg-gray-100 transition">Cancel</button>
            <button type="button" onclick="window.saveHowSection('bridge')" class="btn-primary text-xs py-2 px-5 shadow">Save Changes</button>
          </div>
        </div>
      `;
    } else {
      bridgeCard.innerHTML = `
        ${getHowEditBtnHtml('bridge', canEdit)}
        <div class="pr-10">
          <div class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gsRed mb-2">
            <span>🌉</span> Section 7: Non-Predatory Capital Access
          </div>
          <h3 class="text-2xl md:text-3xl font-display uppercase tracking-tight text-gray-900 mb-2">Graphitti Bridge</h3>
          <p class="text-gray-600 text-sm mb-6">Capital-access layer gated strictly to the cooperative (parents are the verified members):</p>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            <div class="card border-l-4 border-gsGold bg-orange-50/30">
              <span class="badge bg-gsGold text-white text-[10px] mb-2 inline-block">Tier 1 Capital</span>
              <h4 class="font-display uppercase text-lg text-gray-900 mb-1">Working-Capital Top-Up</h4>
              <p class="text-xs text-gray-600 leading-relaxed mb-3">Revolving materials injection. Repaid via a non-burdensome 10% auto-deduction from future marketplace sales.</p>
              <div class="text-[11px] font-bold text-gsBrown uppercase tracking-wider">Revolving · Auto-Deducted 10%</div>
            </div>

            <div class="card border-l-4 border-gsRed bg-red-50/30">
              <span class="badge bg-gsRed text-white text-[10px] mb-2 inline-block">Tier 2 Capital</span>
              <h4 class="font-display uppercase text-lg text-gray-900 mb-1">Soft Growth Loan</h4>
              <p class="text-xs text-gray-600 leading-relaxed mb-3">Up to ₦100,000 for verified equipment procurement, enterprise expansion, or advanced vocational certification.</p>
              <div class="text-[11px] font-bold text-gsRed uppercase tracking-wider">Up to ₦100,000 · Human Reviewed</div>
            </div>
          </div>

          <!-- Cooperative Human-Review Flow -->
          <div class="p-5 bg-gray-50 rounded-lg border border-gray-200 mb-5">
            <h4 class="font-display uppercase text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span>📋</span> Cooperative Approval Flow
            </h4>
            <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
              <div class="p-3 bg-white rounded border text-xs">
                <span class="block font-bold text-gsGold mb-1">Step 1</span>
                Parent joins cooperative
              </div>
              <div class="p-3 bg-white rounded border text-xs">
                <span class="block font-bold text-gsGold mb-1">Step 2</span>
                Child writes letter to parent
              </div>
              <div class="p-3 bg-white rounded border text-xs">
                <span class="block font-bold text-gsGold mb-1">Step 3</span>
                Parent acknowledges
              </div>
              <div class="p-3 bg-white rounded border text-xs">
                <span class="block font-bold text-gsGold mb-1">Step 4</span>
                Letter submitted to Cooperative Committee for human review
              </div>
            </div>
          </div>

          <!-- Roles -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-700">
            <div class="p-3.5 bg-amber-50/60 rounded border border-amber-200">
              <span class="font-bold uppercase text-gsBrown block mb-1">Youth's Role:</span>
              <span>Making their own progress and studio craftsmanship visible as part of this process.</span>
            </div>
            <div class="p-3.5 bg-blue-50/60 rounded border border-blue-200">
              <span class="font-bold uppercase text-gsBlue block mb-1">Teacher's Role:</span>
              <span>Teachers join the cooperative, document the child's process, make it visible, and mentor.</span>
            </div>
          </div>
        </div>
      `;
    }
  }

  // --- 8. TRAINER TRACK (Career Pathway) ---
  const trainerCard = $('how-trainer-card');
  if (trainerCard) {
    if (editingHowSections.trainer_track && canEdit) {
      trainerCard.innerHTML = `
        <div class="space-y-4">
          <div class="flex items-center justify-between border-b pb-2 border-orange-200">
            <h3 class="font-display uppercase text-lg text-gsBrown flex items-center gap-2">
              <span>🎓</span> Editing Section 8: Trainer Track (${masterAdmin ? 'Master Admin' : 'Manager'} In-Place)
            </h3>
            <span class="badge bg-amber-100 text-gsBrown text-xs">Editing Mode</span>
          </div>
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">Trainer Track Pathway & Sub-Tracks</label>
            <textarea id="edit-how-textarea-trainer_track" class="input-field h-40 font-sans text-sm leading-relaxed border-2 border-gsBrown/60 bg-amber-50/20 shadow-inner">${escapeAboutHtml(howItWorksContentMap.trainer_track)}</textarea>
          </div>
          <div class="flex items-center justify-end gap-3 pt-2 border-t">
            <button type="button" onclick="window.cancelEditHowSection('trainer_track')" class="px-4 py-2 border border-gray-300 text-gray-700 rounded text-xs font-bold uppercase tracking-wider hover:bg-gray-100 transition">Cancel</button>
            <button type="button" onclick="window.saveHowSection('trainer_track')" class="btn-primary text-xs py-2 px-5 shadow">Save Changes</button>
          </div>
        </div>
      `;
    } else {
      trainerCard.innerHTML = `
        ${getHowEditBtnHtml('trainer_track', canEdit)}
        <div class="pr-10">
          <div class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gsBrown mb-2">
            <span>🎓</span> Section 8: Professional Career Pathway
          </div>
          <h3 class="text-2xl md:text-3xl font-display uppercase tracking-tight text-gray-900 mb-2">Trainer Track & Career Progression</h3>
          <p class="text-gray-600 text-sm mb-6">A continuous vocational career pathway for artisans and mentors:</p>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            <div class="p-4 bg-white rounded-lg border-t-4 border-gsGold shadow-sm">
              <span class="text-xs font-mono font-bold text-gray-500 block mb-1">TIER 1</span>
              <h4 class="font-display uppercase text-sm font-bold text-gray-900">School-Assigned</h4>
              <p class="text-xs text-gray-600 mt-2 leading-relaxed">Assigned directly to partner schools to run standardized term and holiday modules.</p>
            </div>

            <div class="p-4 bg-white rounded-lg border-t-4 border-gray-400 shadow-sm opacity-90">
              <span class="text-xs font-mono font-bold text-gray-500 block mb-1">TIER 2</span>
              <h4 class="font-display uppercase text-sm font-bold text-gray-900">Market-Assigned</h4>
              <p class="text-xs text-gray-400 mt-2 italic leading-relaxed">Details coming soon (definition pending from client).</p>
            </div>

            <div class="p-4 bg-white rounded-lg border-t-4 border-gsGreen shadow-sm">
              <span class="text-xs font-mono font-bold text-gray-500 block mb-1">TIER 3</span>
              <h4 class="font-display uppercase text-sm font-bold text-gray-900">Independent Enterprise</h4>
              <p class="text-xs text-gray-600 mt-2 leading-relaxed">Certified trainer launches independent training academy with full directory listing.</p>
            </div>

            <div class="p-4 bg-white rounded-lg border-t-4 border-gsBrown shadow-sm">
              <span class="text-xs font-mono font-bold text-gray-500 block mb-1">TIER 4</span>
              <h4 class="font-display uppercase text-sm font-bold text-gray-900">Master Trainer</h4>
              <p class="text-xs text-gray-600 mt-2 leading-relaxed">Master craftsperson accredited to certify incoming trainers and oversee regional hublets.</p>
            </div>
          </div>

          <!-- Teacher Training Enterprise Sub-Track -->
          <div class="p-4 rounded-lg bg-orange-50/70 border border-orange-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <span class="text-2xl">📚</span>
              <div>
                <h5 class="font-display uppercase text-xs font-bold text-gsBrown">Teacher Training Enterprise Track</h5>
                <p class="text-xs text-gray-700 mt-0.5">Sits directly under Master Trainer — certifying classroom teachers into licensed vocational trainers.</p>
              </div>
            </div>
            <span class="badge bg-amber-100 text-gsBrown text-[10px] self-start sm:self-auto">Sub-Track of Master Trainer</span>
          </div>
        </div>
      `;
    }
  }

  // --- 9. COMING SOON ---
  const comingSoonCard = $('how-coming-soon-card');
  if (comingSoonCard) {
    if (editingHowSections.coming_soon && canEdit) {
      comingSoonCard.innerHTML = `
        <div class="space-y-4">
          <div class="flex items-center justify-between border-b pb-2 border-gray-300">
            <h3 class="font-display uppercase text-lg text-gray-700 flex items-center gap-2">
              <span>🚀</span> Editing Section 9: Coming Soon (${masterAdmin ? 'Master Admin' : 'Manager'} In-Place)
            </h3>
            <span class="badge bg-gray-200 text-gray-700 text-xs">Editing Mode</span>
          </div>
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">Coming Soon Features</label>
            <textarea id="edit-how-textarea-coming_soon" class="input-field h-36 font-sans text-sm leading-relaxed border-2 border-gray-400 bg-white shadow-inner">${escapeAboutHtml(howItWorksContentMap.coming_soon)}</textarea>
          </div>
          <div class="flex items-center justify-end gap-3 pt-2 border-t">
            <button type="button" onclick="window.cancelEditHowSection('coming_soon')" class="px-4 py-2 border border-gray-300 text-gray-700 rounded text-xs font-bold uppercase tracking-wider hover:bg-gray-100 transition">Cancel</button>
            <button type="button" onclick="window.saveHowSection('coming_soon')" class="btn-primary text-xs py-2 px-5 shadow">Save Changes</button>
          </div>
        </div>
      `;
    } else {
      comingSoonCard.innerHTML = `
        ${getHowEditBtnHtml('coming_soon', canEdit)}
        <div class="pr-10">
          <div class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
            <span>🚀</span> Section 9: Strategic Roadmap
          </div>
          <h3 class="text-2xl font-display uppercase tracking-tight text-gray-700 mb-4">Coming Soon to Graphitti Studios</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="p-4 bg-white/80 rounded border border-dashed border-gray-300">
              <span class="text-xl mb-1 block">🎟️</span>
              <h4 class="font-display uppercase text-sm font-bold text-gray-800">Market Exhibition Connector</h4>
              <p class="text-xs text-gray-500 mt-1">Specialized roles for curating physical exhibitions, regional showcases, and corporate buyer activations.</p>
            </div>
            <div class="p-4 bg-white/80 rounded border border-dashed border-gray-300">
              <span class="text-xl mb-1 block">🧑‍🏫</span>
              <h4 class="font-display uppercase text-sm font-bold text-gray-800">External Trainer Intake</h4>
              <p class="text-xs text-gray-500 mt-1">Open portal for certified external master craftsmen to onboard their vocational studios into Graphitti.</p>
            </div>
            <div class="p-4 bg-white/80 rounded border border-dashed border-gray-300">
              <span class="text-xl mb-1 block">🎬</span>
              <h4 class="font-display uppercase text-sm font-bold text-gray-800">Storytelling & Film Production</h4>
              <p class="text-xs text-gray-500 mt-1">Film incubator producing indigenous narratives, animation, and Nollywood commercial projects.</p>
            </div>
          </div>
        </div>
      `;
    }
  }
}

// Window actions for How It Works inline editing
window.startEditHowSection = function(sectionKey) {
  if (!isMasterOrManager()) return;
  editingHowSections[sectionKey] = true;
  renderHowItWorksRoom();
};

window.cancelEditHowSection = function(sectionKey) {
  editingHowSections[sectionKey] = false;
  renderHowItWorksRoom();
};

window.saveHowSection = async function(sectionKey) {
  const el = $(`edit-how-textarea-${sectionKey}`);
  if (!el) return;
  const newContent = el.value.trim();
  if (!newContent) {
    showAboutToast('Content cannot be empty.', false);
    return;
  }

  howItWorksContentMap[sectionKey] = newContent;
  localStorage.setItem('gs_how_' + sectionKey, newContent);
  editingHowSections[sectionKey] = false;

  let cloudSuccess = false;
  try {
    const adminId = (currentUser?.data?.id && typeof currentUser.data.id === 'string' && currentUser.data.id.length >= 32) ? currentUser.data.id : null;
    const payload = {
      section_key: sectionKey,
      content_text: newContent,
      updated_at: new Date().toISOString(),
      updated_by: adminId
    };
    const { error } = await supabase
      .from('gs_how_it_works')
      .upsert(payload, { onConflict: 'section_key' });
    if (!error) cloudSuccess = true;
  } catch (err) {
    console.warn('Supabase how_it_works save error:', err);
  }

  showAboutToast(cloudSuccess ? 'Section updated and synced to Supabase!' : 'Section updated in browser storage.');
  renderHowItWorksRoom();
};

// Initial boot load for How It Works content
loadHowItWorksContent();

// ==========================================
// STUDIO LOGO MANAGEMENT (Master Admin, Manager & Staff)
// ==========================================

function canEditLogo() {
  if (!currentUser) return false;
  const r = currentUser.role || currentUser.data?.role;
  return r === 'master' || r === 'admin' || r === 'manager' || r === 'staff' ||
         currentUser.data?.is_master === true || currentUser.data?.is_manager === true;
}

function compressAndResizeImage(file, maxWidth = 512, maxHeight = 512, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function applyLogoToHeader(src) {
  if (!src) return;
  const logoImg = $('main-header-logo');
  if (logoImg) logoImg.src = src;
  const previewImg = $('logo-modal-preview');
  if (previewImg) previewImg.src = src;
}

function updateLogoVisibility() {
  const btn = $('btn-change-logo');
  if (btn) {
    if (canEditLogo()) {
      btn.title = "Update Studio Logo (Authorized operational access)";
    } else {
      btn.title = "Update Studio Logo (Staff PIN: 5555 · Manager: 4321 · Master: 1234)";
    }
  }
}

async function loadCustomLogo() {
  // 1. Check local storage
  const savedLogo = localStorage.getItem('gs_custom_logo');
  if (savedLogo) {
    applyLogoToHeader(savedLogo);
  }

  // 2. Fetch from Supabase gs_about_content
  try {
    const { data, error } = await supabase
      .from('gs_about_content')
      .select('content_text')
      .eq('section_key', 'logo_url')
      .single();
    if (!error && data && data.content_text) {
      applyLogoToHeader(data.content_text);
      try {
        localStorage.setItem('gs_custom_logo', data.content_text);
      } catch (e) {}
    }
  } catch (err) {}
}

window.openLogoModal = function() {
  const modal = $('modal-change-logo');
  if (!modal) return;

  const currentLogo = $('main-header-logo')?.src || '/Screenshot_20260908_102638_WhatsApp.jpg';
  const preview = $('logo-modal-preview');
  if (preview) preview.src = currentLogo;

  const err = $('logo-modal-error');
  if (err) err.classList.add('hidden');

  const compressStatus = $('logo-compress-status');
  if (compressStatus) compressStatus.classList.add('hidden');

  const fileInput = $('logo-file-input');
  if (fileInput) fileInput.value = '';

  const urlInput = $('logo-url-input');
  if (urlInput) urlInput.value = '';

  stagedLogoDataUrl = '';

  // Auth Status Banner
  const statusEl = $('logo-auth-status');
  if (statusEl) {
    if (canEditLogo()) {
      let roleLabel = 'Staff Member';
      if (currentUser.role === 'admin' || currentUser.role === 'master' || currentUser.data?.is_master) roleLabel = 'Master Admin (App Owner & Fortune)';
      else if (currentUser.role === 'manager' || currentUser.data?.is_manager) roleLabel = 'Manager (Barbara Abieyuwa Omoregie)';
      else if (currentUser.role === 'staff') roleLabel = 'Operational Staff';

      statusEl.className = "text-xs p-2.5 rounded mb-3 flex items-center justify-between bg-green-50 text-green-800 border border-green-200 font-medium";
      statusEl.innerHTML = `
        <span class="flex items-center gap-1.5"><span>✓</span> <span>Logged in as <b>${roleLabel}</b>. Permission granted.</span></span>
        <span class="text-[10px] bg-green-200 text-green-900 px-2 py-0.5 rounded uppercase font-bold">Authorized</span>
      `;
    } else {
      statusEl.className = "text-xs p-2.5 rounded mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-amber-50 text-amber-900 border border-amber-200 font-medium";
      statusEl.innerHTML = `
        <div class="flex items-center gap-1.5">
          <span>⚠️</span>
          <span>Viewing as visitor. Log in with Staff (5555), Manager (4321), or Master (1234) PIN to save changes.</span>
        </div>
        <button type="button" onclick="window.closeLogoModal(); window.openLoginModal();" class="text-xs font-bold uppercase bg-amber-200 hover:bg-amber-300 text-amber-900 px-2.5 py-1 rounded shadow-sm whitespace-nowrap self-start sm:self-auto">
          Login Now
        </button>
      `;
    }
  }

  modal.classList.remove('hidden');
};

window.closeLogoModal = function() {
  const modal = $('modal-change-logo');
  if (modal) modal.classList.add('hidden');
};

window.setLogoPreset = function(presetUrl) {
  stagedLogoDataUrl = presetUrl;
  const urlInput = $('logo-url-input');
  if (urlInput) urlInput.value = presetUrl;
  const preview = $('logo-modal-preview');
  if (preview) preview.src = presetUrl;
  const compressStatus = $('logo-compress-status');
  if (compressStatus) {
    compressStatus.textContent = '✓ Preset Selected';
    compressStatus.className = 'text-[10px] font-bold text-green-700';
    compressStatus.classList.remove('hidden');
  }
};

window.resetDefaultLogo = async function() {
  const defaultSrc = '/Screenshot_20260908_102638_WhatsApp.jpg';
  try {
    localStorage.removeItem('gs_custom_logo');
  } catch (e) {}
  applyLogoToHeader(defaultSrc);

  // Sync reset to Supabase if logged in
  if (canEditLogo()) {
    try {
      const adminId = (currentUser?.data?.id && typeof currentUser.data.id === 'string' && currentUser.data.id.length >= 32) ? currentUser.data.id : null;
      await supabase.from('gs_about_content').upsert({
        section_key: 'logo_url',
        content_text: defaultSrc,
        updated_at: new Date().toISOString(),
        updated_by: adminId
      }, { onConflict: 'section_key' });
    } catch (err) {}
  }

  window.closeLogoModal();
  showAboutToast('Logo reset to default WhatsApp photo.');
};

let stagedLogoDataUrl = '';
const logoFileInput = $('logo-file-input');
if (logoFileInput) {
  logoFileInput.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const compressStatus = $('logo-compress-status');
    const preview = $('logo-modal-preview');
    if (compressStatus) {
      compressStatus.textContent = '⏳ Optimizing image...';
      compressStatus.className = 'text-[10px] font-bold text-amber-700';
      compressStatus.classList.remove('hidden');
    }

    try {
      // Compress and resize image to 512x512 max (~40KB JPEG)
      const compressedDataUrl = await compressAndResizeImage(file, 512, 512, 0.85);
      stagedLogoDataUrl = compressedDataUrl;
      if (preview) preview.src = stagedLogoDataUrl;
      if (compressStatus) {
        const kbSize = Math.round((compressedDataUrl.length * 3 / 4) / 1024);
        compressStatus.textContent = `✓ Auto-Optimized (${kbSize} KB)`;
        compressStatus.className = 'text-[10px] font-bold text-green-700';
      }
    } catch (err) {
      console.warn('Canvas compression fallback:', err);
      const reader = new FileReader();
      reader.onload = (event) => {
        stagedLogoDataUrl = event.target.result;
        if (preview) preview.src = stagedLogoDataUrl;
        if (compressStatus) {
          compressStatus.textContent = '✓ Image Loaded';
          compressStatus.className = 'text-[10px] font-bold text-green-700';
        }
      };
      reader.readAsDataURL(file);
    }
  });
}

const logoUrlInput = $('logo-url-input');
if (logoUrlInput) {
  logoUrlInput.addEventListener('input', (e) => {
    const url = e.target.value.trim();
    if (url) {
      const preview = $('logo-modal-preview');
      if (preview) preview.src = url;
    }
  });
}

const logoForm = $('logo-upload-form');
if (logoForm) {
  logoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = $('btn-save-logo');
    const err = $('logo-modal-error');
    if (err) err.classList.add('hidden');

    if (!canEditLogo()) {
      if (err) {
        err.innerHTML = 'You must be logged in as <b>Staff (PIN: 5555)</b>, <b>Manager (PIN: 4321)</b>, or <b>Master Admin (PIN: 1234)</b> to save. <a href="javascript:void(0)" onclick="window.closeLogoModal(); window.openLoginModal();" class="underline ml-1 font-bold">Login here</a>';
        err.classList.remove('hidden');
      }
      showAboutToast('Please log in with Staff, Manager, or Master Admin PIN to save.', false);
      return;
    }

    const urlVal = logoUrlInput ? logoUrlInput.value.trim() : '';
    const chosenSrc = stagedLogoDataUrl || urlVal;

    if (!chosenSrc) {
      if (err) {
        err.textContent = 'Please choose an image file, select a preset, or enter an image URL.';
        err.classList.remove('hidden');
      }
      return;
    }

    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving Logo...';
    }

    let savedLocally = false;
    try {
      localStorage.setItem('gs_custom_logo', chosenSrc);
      savedLocally = true;
    } catch (storageErr) {
      console.warn('localStorage quota warning:', storageErr);
    }

    applyLogoToHeader(chosenSrc);

    // Sync to Supabase gs_about_content
    let syncedCloud = false;
    try {
      const adminId = (currentUser?.data?.id && typeof currentUser.data.id === 'string' && currentUser.data.id.length >= 32) ? currentUser.data.id : null;
      const { error } = await supabase.from('gs_about_content').upsert({
        section_key: 'logo_url',
        content_text: chosenSrc,
        updated_at: new Date().toISOString(),
        updated_by: adminId
      }, { onConflict: 'section_key' });
      if (!error) syncedCloud = true;
    } catch (cloudErr) {
      console.warn('Supabase logo save notice:', cloudErr);
    }

    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Logo';
    }

    window.closeLogoModal();
    showAboutToast(syncedCloud ? '✓ Studio logo saved and synced to database!' : (savedLocally ? '✓ Studio logo updated and saved in browser!' : '✓ Studio logo updated!'));
  });
}

// ==========================================
// MANAGER CURRICULUM EDITOR
// ==========================================
const curriculumData = {
  'Shadow SDG Entrepreneurship': {
    knowledge: 'SDG-aligned creative design, environmental sustainability, ethical materials sourcing, community needs assessment, and entrepreneurship foundations.',
    production: 'Clean resin casting, zero-residue leather craft, pattern drafting, eco-packaging fabrication, and studio safety standards.',
    market: 'Local exhibitions, school enterprise showcase, buyer feedback collection, wholesale pricing formulas, and cooperative credit preparation.'
  },
  'Commercial Creative': {
    knowledge: 'Mass-market creative demand, brand identity, luxury leather crafting principles, and studio economics.',
    production: 'Batch bag production, precision stitching, high-finish hardware installation, and quality control grading.',
    market: 'B2B boutique supply, corporate gifting catalogues, permanent Graphitti marketplace placement, and wholesale distributor relations.'
  },
  'Digital & Tech-Creative': {
    knowledge: 'Digital workflow, generative AI tools, prompt architecture, digital asset protection, and UI/UX design basics.',
    production: 'Media asset rendering, motion graphics, audio mastering, video editing sprints, and cloud project handoff.',
    market: 'Remote creative gigs, digital product kits, freelance agency pitching, and international client billing.'
  },
  'Cultural & Heritage': {
    knowledge: 'Edo bronze casting history, traditional textile dyeing, African storytelling archetypes, and cultural preservation.',
    production: 'Authentic craft reproduction, natural pigments, heritage wood carving, and beadwork craftsmanship.',
    market: 'Cultural festivals, heritage museum gift shops, Nollywood props licensing, and diaspora collector marketing.'
  },
  'Freelance / Portfolio': {
    knowledge: 'Client contracts, proposal engineering, freelance rate calculation, intellectual property, and personal branding.',
    production: 'Signature portfolio development, pitch deck creation, showreel assembly, and case study documentation.',
    market: 'Direct client acquisition, creative agency representation, retainer contracts, and Graphitti Connector referrals.'
  }
};

window.loadManagerCurriculum = function() {
  const select = $('mgr-prog-select');
  if (!select) return;
  const prog = select.value;
  
  const saved = localStorage.getItem('gs_curr_' + prog);
  let data = curriculumData[prog];
  if (saved) {
    try { data = JSON.parse(saved); } catch(e) {}
  }

  if ($('mgr-curr-knowledge')) $('mgr-curr-knowledge').value = data?.knowledge || '';
  if ($('mgr-curr-production')) $('mgr-curr-production').value = data?.production || '';
  if ($('mgr-curr-market')) $('mgr-curr-market').value = data?.market || '';
};

const currForm = $('form-mgr-curriculum');
if (currForm) {
  currForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const select = $('mgr-prog-select');
    const prog = select ? select.value : 'Shadow SDG Entrepreneurship';
    const knowledge = $('mgr-curr-knowledge')?.value.trim() || '';
    const production = $('mgr-curr-production')?.value.trim() || '';
    const market = $('mgr-curr-market')?.value.trim() || '';

    const payload = { knowledge, production, market };
    curriculumData[prog] = payload;
    try {
      localStorage.setItem('gs_curr_' + prog, JSON.stringify(payload));
    } catch(err) {}

    try {
      const adminId = (currentUser?.data?.id && typeof currentUser.data.id === 'string' && currentUser.data.id.length >= 32) ? currentUser.data.id : null;
      await supabase.from('gs_about_content').upsert({
        section_key: 'curriculum_' + prog.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        content_text: JSON.stringify(payload),
        updated_at: new Date().toISOString(),
        updated_by: adminId
      }, { onConflict: 'section_key' });
    } catch(e) {}

    showAboutToast(`✓ Curriculum updates for "${prog}" saved successfully!`);
  });
}

// Initial boot load for Logo & Curriculum
loadCustomLogo();
updateLogoVisibility();
window.loadManagerCurriculum();


